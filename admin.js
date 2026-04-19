(() => {
  const cfg = window.KIZO_CONFIG || {};
  const hasConfig = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase?.createClient);

  const refs = {
    configStatus: document.getElementById('configStatus'),
    authCard: document.getElementById('authCard'),
    loginForm: document.getElementById('loginForm'),
    loginStatus: document.getElementById('loginStatus'),
    logoutBtn: document.getElementById('logoutBtn'),
    mediaCard: document.getElementById('mediaCard'),
    messagesCard: document.getElementById('messagesCard'),
    uploadForm: document.getElementById('uploadForm'),
    uploadStatus: document.getElementById('uploadStatus'),
    mediaList: document.getElementById('mediaList'),
    messagesList: document.getElementById('messagesList'),
    browserNotifyBtn: document.getElementById('browserNotifyBtn')
  };

  const state = {
    client: null,
    session: null,
    mediaItems: [],
    messageItems: [],
    messageChannel: null
  };

  const mediaTable = cfg.mediaTable || 'media_items';
  const messageTable = cfg.messagesTable || 'contact_messages';
  const mediaBucket = cfg.mediaBucket || 'kizo-media';

  const setStatus = (el, text, type = '') => {
    if (!el) return;
    el.textContent = text;
    el.classList.remove('success', 'error');
    if (type) {
      el.classList.add(type);
    }
  };

  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
  };

  const normalizeMediaType = (value) => {
    const t = String(value || '').toLowerCase();
    return t === 'video' ? 'video' : 'photo';
  };

  const getClient = () => {
    if (state.client) {
      return state.client;
    }

    state.client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return state.client;
  };

  const setAuthUi = (isLoggedIn) => {
    refs.authCard.hidden = isLoggedIn;
    refs.mediaCard.hidden = !isLoggedIn;
    refs.messagesCard.hidden = !isLoggedIn;
    refs.logoutBtn.hidden = !isLoggedIn;
  };

  const renderMediaList = () => {
    refs.mediaList.innerHTML = '';

    if (!state.mediaItems.length) {
      refs.mediaList.innerHTML = '<p class="status">No media yet.</p>';
      return;
    }

    state.mediaItems.forEach((item) => {
      const root = document.createElement('article');
      root.className = 'media-item';

      const preview = document.createElement(item.media_type === 'video' ? 'video' : 'img');
      if (item.media_type === 'video') {
        preview.src = item.public_url;
        preview.poster = item.thumbnail_url || '';
        preview.muted = true;
        preview.playsInline = true;
      } else {
        preview.src = item.thumbnail_url || item.public_url;
        preview.alt = item.title_ka || item.title_en || item.title_ru || 'Media preview';
      }

      const meta = document.createElement('div');
      meta.className = 'media-meta';
      meta.innerHTML = `
        <strong>${escapeHtml(item.title_ka || item.title_en || item.title_ru || '-')}</strong>
        <p>Type: ${escapeHtml(item.media_type)}</p>
        <p>Created: ${escapeHtml(formatDate(item.created_at))}</p>
      `;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn ghost';
      removeBtn.textContent = 'Delete';
      removeBtn.addEventListener('click', () => removeMedia(item));

      root.appendChild(preview);
      root.appendChild(meta);
      root.appendChild(removeBtn);
      refs.mediaList.appendChild(root);
    });
  };

  const renderMessages = () => {
    refs.messagesList.innerHTML = '';

    if (!state.messageItems.length) {
      refs.messagesList.innerHTML = '<p class="status">No messages yet.</p>';
      return;
    }

    state.messageItems.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'message-item';
      article.innerHTML = `
        <strong>${escapeHtml(item.name || 'Unknown')}</strong>
        <p>Phone: ${escapeHtml(item.phone || '-')}</p>
        <p>Email: ${escapeHtml(item.email || '-')}</p>
        <p>${escapeHtml(item.message || '')}</p>
        <small>${escapeHtml(formatDate(item.created_at))}</small>
      `;
      refs.messagesList.appendChild(article);
    });
  };

  const fetchMedia = async () => {
    const client = getClient();
    const { data, error } = await client
      .from(mediaTable)
      .select('id, title_ka, title_en, title_ru, media_type, public_url, thumbnail_url, file_path, thumbnail_path, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    state.mediaItems = (data || []).map((item) => ({
      ...item,
      media_type: normalizeMediaType(item.media_type)
    }));
    renderMediaList();
  };

  const fetchMessages = async () => {
    const client = getClient();
    const { data, error } = await client
      .from(messageTable)
      .select('id, name, phone, email, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    state.messageItems = data || [];
    renderMessages();
  };

  const buildSafePath = (type, fileName) => {
    const safeName = String(fileName || 'file')
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/-+/g, '-');
    return `${type}/${Date.now()}-${Math.floor(Math.random() * 100000)}-${safeName}`;
  };

  const uploadToBucket = async (file, path) => {
    const client = getClient();
    const { error } = await client.storage.from(mediaBucket).upload(path, file, {
      upsert: false,
      contentType: file.type || undefined
    });

    if (error) {
      throw error;
    }

    const { data } = client.storage.from(mediaBucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const removeMedia = async (item) => {
    if (!window.confirm('Delete this media item?')) {
      return;
    }

    const client = getClient();

    try {
      if (item.file_path) {
        await client.storage.from(mediaBucket).remove([item.file_path]);
      }

      if (item.thumbnail_path) {
        await client.storage.from(mediaBucket).remove([item.thumbnail_path]);
      }

      const { error } = await client.from(mediaTable).delete().eq('id', item.id);
      if (error) {
        throw error;
      }

      await fetchMedia();
    } catch (error) {
      alert(`Failed to delete media: ${error.message || error}`);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    const client = getClient();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const mediaType = normalizeMediaType(formData.get('mediaType'));
    const titleKa = String(formData.get('titleKa') || '').trim();
    const titleEn = String(formData.get('titleEn') || '').trim();
    const titleRu = String(formData.get('titleRu') || '').trim();
    const mediaFile = formData.get('mediaFile');
    const thumbFile = formData.get('thumbFile');

    if (!titleKa || !(mediaFile instanceof File) || !mediaFile.size) {
      setStatus(refs.uploadStatus, 'Title (Georgian) and media file are required.', 'error');
      return;
    }

    setStatus(refs.uploadStatus, 'Uploading...');

    try {
      const mediaPath = buildSafePath(mediaType, mediaFile.name);
      const mediaPublicUrl = await uploadToBucket(mediaFile, mediaPath);

      let thumbPublicUrl = mediaType === 'video' ? './assets/gallery-04.png' : mediaPublicUrl;
      let thumbPath = null;

      if (thumbFile instanceof File && thumbFile.size) {
        thumbPath = buildSafePath('thumbnails', thumbFile.name);
        thumbPublicUrl = await uploadToBucket(thumbFile, thumbPath);
      }

      const payload = {
        title_ka: titleKa,
        title_en: titleEn || null,
        title_ru: titleRu || null,
        media_type: mediaType,
        file_path: mediaPath,
        public_url: mediaPublicUrl,
        thumbnail_url: thumbPublicUrl,
        thumbnail_path: thumbPath,
        published: true
      };

      const { error } = await client.from(mediaTable).insert(payload);
      if (error) {
        throw error;
      }

      setStatus(refs.uploadStatus, 'Media uploaded successfully.', 'success');
      form.reset();
      await fetchMedia();
    } catch (error) {
      setStatus(refs.uploadStatus, `Upload failed: ${error.message || error}`, 'error');
    }
  };

  const maybeBrowserNotify = (payload) => {
    if (Notification.permission !== 'granted') {
      return;
    }

    const title = `New message: ${payload.name || 'Customer'}`;
    const body = `${payload.phone || '-'} | ${(payload.message || '').slice(0, 100)}`;
    const notification = new Notification(title, { body });

    setTimeout(() => notification.close(), 4500);
  };

  const subscribeMessages = async () => {
    const client = getClient();

    if (state.messageChannel) {
      await client.removeChannel(state.messageChannel);
      state.messageChannel = null;
    }

    state.messageChannel = client
      .channel('public:contact_messages_admin')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: messageTable
        },
        (payload) => {
          const row = payload.new;
          state.messageItems = [row, ...state.messageItems].slice(0, 100);
          renderMessages();
          maybeBrowserNotify(row);
        }
      )
      .subscribe();
  };

  const initLoggedInView = async () => {
    setAuthUi(true);
    setStatus(refs.loginStatus, '');

    try {
      await Promise.all([fetchMedia(), fetchMessages(), subscribeMessages()]);
    } catch (error) {
      console.error(error);
      alert(`Failed to load admin data: ${error.message || error}`);
    }
  };

  const initAuth = async () => {
    const client = getClient();

    const {
      data: { session }
    } = await client.auth.getSession();

    state.session = session;
    if (session) {
      await initLoggedInView();
    } else {
      setAuthUi(false);
    }

    client.auth.onAuthStateChange(async (_event, sessionData) => {
      state.session = sessionData;
      if (sessionData) {
        await initLoggedInView();
      } else {
        setAuthUi(false);
      }
    });
  };

  const init = async () => {
    if (!hasConfig) {
      refs.configStatus.textContent = 'Missing Supabase config. Update site-config.js first.';
      refs.configStatus.style.color = '#ffb8b8';
      setAuthUi(false);
      return;
    }

    refs.configStatus.textContent = 'Supabase config detected.';
    refs.configStatus.style.color = '#8ae2b0';

    refs.loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '');

      if (!email || !password) {
        setStatus(refs.loginStatus, 'Email and password are required.', 'error');
        return;
      }

      setStatus(refs.loginStatus, 'Signing in...');

      try {
        const client = getClient();
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
        setStatus(refs.loginStatus, 'Signed in.', 'success');
      } catch (error) {
        setStatus(refs.loginStatus, `Login failed: ${error.message || error}`, 'error');
      }
    });

    refs.logoutBtn.addEventListener('click', async () => {
      const client = getClient();
      await client.auth.signOut();
      setAuthUi(false);
    });

    refs.uploadForm.addEventListener('submit', handleUpload);

    refs.browserNotifyBtn.addEventListener('click', async () => {
      if (!('Notification' in window)) {
        alert('Browser notifications are not supported in this browser.');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        refs.browserNotifyBtn.textContent = 'Browser Notifications Enabled';
      }
    });

    await initAuth();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
