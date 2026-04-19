(() => {
  const revealElements = Array.from(document.querySelectorAll('.reveal'));
  const runtimes = [];
  const config = window.KIZO_CONFIG || {};
  let supabaseClient = null;
  let currentLang = 'ka';

  const fallbackMedia = [
    {
      id: 'local-photo-1',
      media_type: 'photo',
      title_ka: 'დასრულებული დეკორატიული ბეტონის პროექტი',
      title_en: 'Finished decorative concrete project',
      title_ru: 'Завершенный декоративный бетонный проект',
      public_url: './assets/gallery-01.png',
      thumbnail_url: './assets/gallery-01.png'
    },
    {
      id: 'local-photo-2',
      media_type: 'photo',
      title_ka: 'ზედაპირის ზუსტი ფორმირება და კიდეების დამუშავება',
      title_en: 'Precise slab shaping and edge finishing',
      title_ru: 'Точная формовка поверхности и обработка кромок',
      public_url: './assets/gallery-02.png',
      thumbnail_url: './assets/gallery-02.png'
    },
    {
      id: 'local-photo-3',
      media_type: 'photo',
      title_ka: 'პატერნიანი ზედაპირის დასრულება მაღალი სიზუსტით',
      title_en: 'Patterned surface finish with high precision',
      title_ru: 'Узорная отделка поверхности с высокой точностью',
      public_url: './assets/gallery-03.png',
      thumbnail_url: './assets/gallery-03.png'
    },
    {
      id: 'local-photo-4',
      media_type: 'photo',
      title_ka: 'სამუშაო პროცესი ადგილზე: ზედაპირის გაპრიალება და ფინიში',
      title_en: 'On-site finishing and polishing process',
      title_ru: 'Процесс полировки и финишной обработки на объекте',
      public_url: './assets/gallery-04.png',
      thumbnail_url: './assets/gallery-04.png'
    },
    {
      id: 'local-photo-5',
      media_type: 'photo',
      title_ka: 'გარე სივრცის დასრულებული ბეტონის პლატფორმა',
      title_en: 'Completed outdoor concrete platform',
      title_ru: 'Готовая наружная бетонная площадка',
      public_url: './assets/gallery-05.png',
      thumbnail_url: './assets/gallery-05.png'
    },
    {
      id: 'local-video-1',
      media_type: 'video',
      title_ka: 'რეალური ობიექტის სამუშაო პროცესი',
      title_en: 'Real on-site work process',
      title_ru: 'Реальный процесс работ на объекте',
      public_url: './assets/project-video-01.mp4',
      thumbnail_url: './assets/gallery-04.png'
    }
  ];

  const translations = {
    ka: {
      brand_name: 'Kizo Group',
      brand_sub: 'კიზო ჯგუფი',
      nav_about: 'ჩვენ შესახებ',
      nav_services: 'სერვისები',
      nav_work: 'გალერეა',
      nav_why: 'რატომ ჩვენ',
      nav_contact: 'კონტაქტი',
      hero_eyebrow: 'Kizo Group (კიზო ჯგუფი)',
      hero_title: 'პროფესიონალური იატაკის მოჭიმვა და მოპრიალება',
      hero_lead: 'Professional Floor Tightening & Polishing for homes, businesses, and industrial spaces.',
      hero_text: 'ვმუშაობთ სიზუსტით, თანამედროვე მეთოდებით და პასუხისმგებლობით, რათა მიიღოთ გამძლე, სუფთა და ვიზუალურად პრემიუმ შედეგი.',
      hero_cta: 'დაგვიკავშირდით',
      hero_panel_title: 'სანდო პარტნიორი იატაკის სამუშაოებში',
      hero_panel_item1: 'საცხოვრებელი ობიექტები',
      hero_panel_item2: 'კომერციული ფართები',
      hero_panel_item3: 'ინდუსტრიული გარემო',
      hero_panel_text: 'სწრაფი რეაგირება, ხარისხიანი მასალები და შედეგი, რომელიც დროს უძლებს.',
      about_eyebrow: 'ჩვენ შესახებ',
      about_title: 'გამოცდილება, ხარისხი და პასუხისმგებლობა ერთ გუნდში',
      about_p1: 'Kizo Group არის პროფესიონალური კომპანია, რომელიც სპეციალიზდება იატაკის მოჭიმვაში, მოპრიალებასა და ზედაპირის დასრულებაში. ჩვენთვის მთავარი პრიორიტეტია გამძლე შედეგი, სუფთა შესრულება და კლიენტთან გამჭვირვალე კომუნიკაცია.',
      about_p2: 'მრავალწლიანი პრაქტიკისა და ტექნიკური სტანდარტების დაცვით, ვასრულებთ როგორც მცირე კერძო პროექტებს, ასევე მასშტაბურ კომერციულ და ინდუსტრიულ სამუშაოებს.',
      services_eyebrow: 'სერვისები',
      services_title: 'ძირითადი მომსახურება',
      service1_title: 'Floor Cement Tightening',
      service1_desc: 'იატაკის მოჭიმვა ზედაპირის სტრუქტურული გამძლეობის გასაუმჯობესებლად.',
      service1_benefit: 'შედეგი: უფრო მტკიცე და საიმედო იატაკი მაღალი დატვირთვისთვის.',
      service2_title: 'Floor Polishing',
      service2_desc: 'იატაკის მოპრიალება ერთგვაროვანი, სუფთა და პრემიუმ ვიზუალისთვის.',
      service2_benefit: 'შედეგი: უკეთესი ესთეტიკა და მარტივი მოვლა ყოველდღიურ რეჟიმში.',
      service3_title: 'Surface Finishing',
      service3_desc: 'ზედაპირის დასრულება ტექნიკური და ვიზუალური ხარისხის საბოლოო სტანდარტით.',
      service3_benefit: 'შედეგი: გამძლე, ზუსტი და დასრულებული ზედაპირი ხანგრძლივი ექსპლუატაციისთვის.',
      work_eyebrow: 'ნამუშევრები / გალერეა',
      work_title: 'ნამუშევრების მედია გალერეა',
      gallery_window_title: 'კომპაქტური გალერეა',
      gallery_window_text: 'აქ ჩანს მხოლოდ მოკლე preview. სრული ფოტოების და ვიდეოების სანახავად გახსენით გალერეა.',
      gallery_tab_photos: 'ფოტო გალერეა',
      gallery_tab_videos: 'ვიდეო გალერეა',
      gallery_open_all: 'სრული გალერეის გახსნა',
      gallery_modal_title: 'სრული მედია გალერეა',
      gallery_empty: 'მედია ჯერ არ არის დამატებული.',
      why_eyebrow: 'რატომ ჩვენ',
      why_title: 'Kizo Group-ის უპირატესობები',
      why_1: 'ხარისხიანი შესრულება',
      why_2: 'თანამედროვე ტექნოლოგიები',
      why_3: 'გამძლე შედეგი',
      why_4: 'სუფთა და ზუსტი სამუშაო',
      contact_eyebrow: 'კონტაქტი',
      contact_title: 'მზად ვართ თქვენი პროექტისთვის',
      contact_text: 'დაგვიკავშირდით კონსულტაციისთვის და შევარჩიოთ თქვენი ობიექტისთვის საუკეთესო გადაწყვეტა.',
      contact_phone_label: 'ტელეფონი:',
      contact_email_label: 'Email:',
      contact_wa_label: 'WhatsApp:',
      contact_wa_link: 'მოგვწერეთ WhatsApp-ზე',
      call_btn: 'დაგვირეკეთ',
      wa_btn: 'WhatsApp',
      fb_btn: 'Facebook',
      form_title: 'მოგვწერეთ შეტყობინება',
      form_text: 'ფორმის გაგზავნის შემდეგ, შეტყობინება ჩაიწერება სისტემაში და გაიგზავნება ტელეფონის ნოტიფიკაციად.',
      form_name: 'სახელი',
      form_phone: 'ტელეფონი',
      form_email: 'Email (არასავალდებულო)',
      form_message: 'შეტყობინება',
      form_name_ph: 'თქვენი სახელი',
      form_phone_ph: 'მაგ: +995 5XX XXX XXX',
      form_email_ph: 'you@example.com',
      form_message_ph: 'რა ტიპის ობიექტზე გინდათ მუშაობა?',
      form_submit: 'გაგზავნა',
      form_status_loading: 'იგზავნება...',
      form_status_success: 'შეტყობინება წარმატებით გაიგზავნა. მალე დაგიკავშირდებით.',
      form_status_error: 'გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან ან დაგვირეკეთ პირდაპირ.',
      footer_name: 'Kizo Group (კიზო ჯგუფი)',
      footer_services: 'Floor Cement Tightening | Floor Polishing | Surface Finishing',
      footer_about: 'ჩვენ შესახებ',
      footer_services_link: 'სერვისები',
      footer_contact: 'კონტაქტი'
    },
    en: {
      brand_name: 'Kizo Group',
      brand_sub: 'Kizo Group',
      nav_about: 'About',
      nav_services: 'Services',
      nav_work: 'Gallery',
      nav_why: 'Why Us',
      nav_contact: 'Contact',
      hero_eyebrow: 'Kizo Group',
      hero_title: 'Professional Floor Tightening & Polishing',
      hero_lead: 'Reliable surface solutions for homes, businesses, and industrial facilities.',
      hero_text: 'We work with precision, modern methods, and strong accountability to deliver durable, clean, and premium-looking results.',
      hero_cta: 'Contact Us',
      hero_panel_title: 'Trusted Partner for Floor Works',
      hero_panel_item1: 'Residential Properties',
      hero_panel_item2: 'Commercial Spaces',
      hero_panel_item3: 'Industrial Environments',
      hero_panel_text: 'Fast response, quality materials, and long-lasting performance.',
      about_eyebrow: 'About',
      about_title: 'Experience, Quality, and Reliability in One Team',
      about_p1: 'Kizo Group is a professional company specializing in floor cement tightening, floor polishing, and surface finishing. Our core priorities are durability, clean execution, and transparent communication.',
      about_p2: 'With years of practical experience and strict technical standards, we handle both private projects and large commercial or industrial jobs.',
      services_eyebrow: 'Services',
      services_title: 'Core Services',
      service1_title: 'Floor Cement Tightening',
      service1_desc: 'Strengthening floor surfaces to improve structural durability and load performance.',
      service1_benefit: 'Result: stronger and more reliable floors for heavy daily use.',
      service2_title: 'Floor Polishing',
      service2_desc: 'Polishing floors for a smooth, clean, and premium visual finish.',
      service2_benefit: 'Result: improved aesthetics and easier maintenance.',
      service3_title: 'Surface Finishing',
      service3_desc: 'Final surface finishing with technical precision and visual consistency.',
      service3_benefit: 'Result: durable, accurate, and complete surface quality.',
      work_eyebrow: 'Work / Gallery',
      work_title: 'Project Media Gallery',
      gallery_window_title: 'Compact Gallery',
      gallery_window_text: 'Only a short preview is shown here. Open the gallery to see all photos and videos.',
      gallery_tab_photos: 'Photo Gallery',
      gallery_tab_videos: 'Video Gallery',
      gallery_open_all: 'Open Full Gallery',
      gallery_modal_title: 'Full Media Gallery',
      gallery_empty: 'No media has been added yet.',
      why_eyebrow: 'Why Us',
      why_title: 'Why Choose Kizo Group',
      why_1: 'High-quality execution',
      why_2: 'Modern technologies',
      why_3: 'Durable results',
      why_4: 'Clean and precise workflow',
      contact_eyebrow: 'Contact',
      contact_title: 'Ready for Your Project',
      contact_text: 'Contact us for a consultation and we will choose the best solution for your property.',
      contact_phone_label: 'Phone:',
      contact_email_label: 'Email:',
      contact_wa_label: 'WhatsApp:',
      contact_wa_link: 'Message us on WhatsApp',
      call_btn: 'Call Us',
      wa_btn: 'WhatsApp',
      fb_btn: 'Facebook',
      form_title: 'Send Us a Message',
      form_text: 'After submission, your message is saved in the system and sent as a phone notification.',
      form_name: 'Name',
      form_phone: 'Phone',
      form_email: 'Email (optional)',
      form_message: 'Message',
      form_name_ph: 'Your name',
      form_phone_ph: 'Example: +995 5XX XXX XXX',
      form_email_ph: 'you@example.com',
      form_message_ph: 'What kind of property/project do you need?',
      form_submit: 'Send Message',
      form_status_loading: 'Sending...',
      form_status_success: 'Message sent successfully. We will contact you soon.',
      form_status_error: 'Could not send message. Please try again or call us directly.',
      footer_name: 'Kizo Group',
      footer_services: 'Floor Cement Tightening | Floor Polishing | Surface Finishing',
      footer_about: 'About',
      footer_services_link: 'Services',
      footer_contact: 'Contact'
    },
    ru: {
      brand_name: 'Kizo Group',
      brand_sub: 'Кизо Групп',
      nav_about: 'О нас',
      nav_services: 'Услуги',
      nav_work: 'Галерея',
      nav_why: 'Почему мы',
      nav_contact: 'Контакты',
      hero_eyebrow: 'Kizo Group',
      hero_title: 'Профессиональная стяжка и полировка полов',
      hero_lead: 'Надежные решения для домов, бизнеса и промышленных объектов.',
      hero_text: 'Мы работаем точно, с современными методами и высокой ответственностью, чтобы вы получили прочный, чистый и премиальный результат.',
      hero_cta: 'Связаться с нами',
      hero_panel_title: 'Надежный партнер по напольным работам',
      hero_panel_item1: 'Жилые объекты',
      hero_panel_item2: 'Коммерческие помещения',
      hero_panel_item3: 'Промышленные объекты',
      hero_panel_text: 'Быстрый отклик, качественные материалы и долговечный результат.',
      about_eyebrow: 'О нас',
      about_title: 'Опыт, качество и надежность в одной команде',
      about_p1: 'Kizo Group - профессиональная компания, специализирующаяся на стяжке полов, полировке и финишной отделке поверхностей. Наши приоритеты: долговечность, чистое исполнение и прозрачная коммуникация.',
      about_p2: 'Благодаря многолетнему опыту и строгим техническим стандартам, мы выполняем как частные, так и крупные коммерческие и промышленные проекты.',
      services_eyebrow: 'Услуги',
      services_title: 'Основные услуги',
      service1_title: 'Стяжка пола',
      service1_desc: 'Укрепление пола для повышения структурной прочности и устойчивости к нагрузкам.',
      service1_benefit: 'Результат: более прочный и надежный пол для интенсивной эксплуатации.',
      service2_title: 'Полировка пола',
      service2_desc: 'Полировка для гладкой, чистой и премиальной поверхности.',
      service2_benefit: 'Результат: улучшенная эстетика и легкий уход.',
      service3_title: 'Финишная отделка поверхности',
      service3_desc: 'Финальная отделка поверхности с технической точностью и визуальной аккуратностью.',
      service3_benefit: 'Результат: долговечная, точная и завершенная поверхность.',
      work_eyebrow: 'Работы / Галерея',
      work_title: 'Медиа-галерея проектов',
      gallery_window_title: 'Компактная галерея',
      gallery_window_text: 'Здесь показывается только краткий preview. Откройте галерею, чтобы увидеть все фото и видео.',
      gallery_tab_photos: 'Фото галерея',
      gallery_tab_videos: 'Видео галерея',
      gallery_open_all: 'Открыть полную галерею',
      gallery_modal_title: 'Полная медиа-галерея',
      gallery_empty: 'Медиа пока не добавлены.',
      why_eyebrow: 'Почему мы',
      why_title: 'Преимущества Kizo Group',
      why_1: 'Качественное исполнение',
      why_2: 'Современные технологии',
      why_3: 'Долговечный результат',
      why_4: 'Чистая и точная работа',
      contact_eyebrow: 'Контакты',
      contact_title: 'Готовы к вашему проекту',
      contact_text: 'Свяжитесь с нами для консультации и подбора лучшего решения для вашего объекта.',
      contact_phone_label: 'Телефон:',
      contact_email_label: 'Email:',
      contact_wa_label: 'WhatsApp:',
      contact_wa_link: 'Написать в WhatsApp',
      call_btn: 'Позвонить',
      wa_btn: 'WhatsApp',
      fb_btn: 'Facebook',
      form_title: 'Отправьте сообщение',
      form_text: 'После отправки сообщение сохраняется в системе и уходит как уведомление на телефон.',
      form_name: 'Имя',
      form_phone: 'Телефон',
      form_email: 'Email (необязательно)',
      form_message: 'Сообщение',
      form_name_ph: 'Ваше имя',
      form_phone_ph: 'Например: +995 5XX XXX XXX',
      form_email_ph: 'you@example.com',
      form_message_ph: 'Какой тип объекта/работ вам нужен?',
      form_submit: 'Отправить',
      form_status_loading: 'Отправка...',
      form_status_success: 'Сообщение отправлено. Мы скоро свяжемся с вами.',
      form_status_error: 'Не удалось отправить сообщение. Попробуйте снова или позвоните напрямую.',
      footer_name: 'Kizo Group',
      footer_services: 'Стяжка пола | Полировка пола | Финишная отделка',
      footer_about: 'О нас',
      footer_services_link: 'Услуги',
      footer_contact: 'Контакты'
    }
  };

  const langLabels = {
    ka: 'ქართული',
    en: 'English',
    ru: 'Русский'
  };

  const mediaState = {
    items: [],
    previewType: 'photo',
    modalType: 'photo'
  };

  const mediaEls = {
    tabs: document.getElementById('mediaTabs'),
    previewPhoto: document.getElementById('mediaPreviewPhoto'),
    previewVideo: document.getElementById('mediaPreviewVideo'),
    openModalBtn: document.getElementById('openGalleryBtn'),
    modal: document.getElementById('galleryModal'),
    modalBackdrop: document.getElementById('galleryModalBackdrop'),
    modalClose: document.getElementById('galleryModalClose'),
    modalTabs: document.getElementById('galleryModalTabs'),
    modalGrid: document.getElementById('galleryModalGrid')
  };

  const lightboxEls = {
    root: document.getElementById('galleryLightbox'),
    image: document.getElementById('lightboxImage'),
    caption: document.getElementById('lightboxCaption'),
    close: document.getElementById('lightboxClose'),
    backdrop: document.getElementById('lightboxBackdrop')
  };

  const getPack = () => translations[currentLang] || translations.ka;

  const mount = (factory, target, options = {}) => {
    if (!target || typeof factory !== 'function') {
      return null;
    }

    try {
      const runtime = factory(target, options);
      if (runtime && typeof runtime.start === 'function') {
        runtime.start();
      }
      runtimes.push(runtime);
      return runtime;
    } catch (_error) {
      return null;
    }
  };

  const initReveals = () => {
    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('in-view'));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  };

  const initInteractionAssets = () => {
    mount(window.backgrounds?.[2], document.getElementById('bgFx'), {
      intensity: 0.72,
      performance: 'balanced'
    });

    ['callPairBtn', 'whatsappPairBtn', 'facebookPairBtn'].forEach((id) => {
      const target = document.getElementById(id);
      mount(window.buttonEffects?.[6], target, {
        intensity: 0.58,
        preview: true
      });
    });
  };

  const createSupabaseClient = () => {
    if (!config.supabaseUrl || !config.supabaseAnonKey || !window.supabase?.createClient) {
      return null;
    }

    if (supabaseClient) {
      return supabaseClient;
    }

    supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });

    return supabaseClient;
  };

  const normalizeMediaType = (value, source = '') => {
    const typeValue = String(value || '').toLowerCase();
    const sourceValue = String(source || '').toLowerCase();
    const combined = `${typeValue} ${sourceValue}`;

    if (combined.includes('video') || /(\.mp4|\.webm|\.mov|\.m4v|\.avi)(\\?|$)/.test(combined)) {
      return 'video';
    }

    if (combined.includes('photo') || combined.includes('image')) {
      return 'photo';
    }

    return 'photo';
  };

  const mapMediaItem = (item, client) => {
    const type = normalizeMediaType(item.media_type, `${item.public_url || ''} ${item.file_path || ''}`);
    const bucket = config.mediaBucket || 'kizo-media';

    let publicUrl = item.public_url || '';
    if (!publicUrl && item.file_path && client) {
      const { data } = client.storage.from(bucket).getPublicUrl(item.file_path);
      publicUrl = data?.publicUrl || '';
    }

    let thumb = item.thumbnail_url || '';
    if (!thumb) {
      thumb = type === 'video' ? './assets/gallery-04.png' : publicUrl;
    }

    return {
      id: item.id,
      media_type: type,
      public_url: publicUrl,
      thumbnail_url: thumb,
      title_ka: item.title_ka || item.title || '',
      title_en: item.title_en || item.title || '',
      title_ru: item.title_ru || item.title || ''
    };
  };

  const loadMedia = async () => {
    const client = createSupabaseClient();
    if (!client) {
      mediaState.items = fallbackMedia;
      return;
    }

    try {
      const { data, error } = await client
        .from(config.mediaTable || 'media_items')
        .select('id, title, title_ka, title_en, title_ru, media_type, public_url, thumbnail_url, file_path, published, sort_order, created_at')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error || !Array.isArray(data) || data.length === 0) {
        mediaState.items = fallbackMedia;
        return;
      }

      const normalized = data.map((item) => mapMediaItem(item, client)).filter((item) => !!item.public_url);
      mediaState.items = normalized.length ? normalized : fallbackMedia;
    } catch (_error) {
      mediaState.items = fallbackMedia;
    }
  };

  const getItemTitle = (item) => {
    if (currentLang === 'en') return item.title_en || item.title_ka || item.title_ru || '';
    if (currentLang === 'ru') return item.title_ru || item.title_ka || item.title_en || '';
    return item.title_ka || item.title_en || item.title_ru || '';
  };

  const mediaByType = (type) =>
    mediaState.items.filter(
      (item) =>
        normalizeMediaType(item.media_type, `${item.public_url || ''} ${item.file_path || ''}`) === type
    );

  const createPreviewCard = (item, isVideo = false) => {
    const card = document.createElement('article');
    card.className = 'media-preview-card';

    const thumb = document.createElement('div');
    thumb.className = 'media-preview-thumb';

    const img = document.createElement('img');
    img.src = item.thumbnail_url || item.public_url;
    img.alt = getItemTitle(item);
    img.loading = 'lazy';
    thumb.appendChild(img);

    if (isVideo) {
      const icon = document.createElement('span');
      icon.className = 'media-video-icon';
      icon.textContent = '▶';
      thumb.appendChild(icon);
    }

    const info = document.createElement('div');
    info.className = 'media-preview-info';
    const title = document.createElement('p');
    title.textContent = getItemTitle(item);
    info.appendChild(title);

    card.appendChild(thumb);
    card.appendChild(info);
    return card;
  };

  const createModalItem = (item, isVideo = false) => {
    const fig = document.createElement('figure');
    fig.className = `gallery-modal-item ${isVideo ? 'video' : 'photo'}`;

    if (isVideo) {
      const video = document.createElement('video');
      video.controls = true;
      video.preload = 'metadata';
      video.src = item.public_url;
      if (item.thumbnail_url) {
        video.poster = item.thumbnail_url;
      }
      fig.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.public_url;
      img.alt = getItemTitle(item);
      img.loading = 'lazy';
      fig.appendChild(img);

      fig.addEventListener('click', () => openLightbox(item.public_url, getItemTitle(item)));
      fig.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(item.public_url, getItemTitle(item));
        }
      });
      fig.tabIndex = 0;
      fig.setAttribute('role', 'button');
    }

    const cap = document.createElement('figcaption');
    cap.textContent = getItemTitle(item);
    fig.appendChild(cap);

    return fig;
  };

  const renderEmpty = (container) => {
    const p = document.createElement('p');
    p.className = 'media-empty';
    p.textContent = getPack().gallery_empty;
    container.appendChild(p);
  };

  const renderPreview = () => {
    if (!mediaEls.previewPhoto || !mediaEls.previewVideo) {
      return;
    }

    const photos = mediaByType('photo').slice(0, 3);
    const videos = mediaByType('video').slice(0, 3);

    mediaEls.previewPhoto.innerHTML = '';
    mediaEls.previewVideo.innerHTML = '';

    if (!photos.length) {
      renderEmpty(mediaEls.previewPhoto);
    } else {
      photos.forEach((item) => mediaEls.previewPhoto.appendChild(createPreviewCard(item, false)));
    }

    if (!videos.length) {
      renderEmpty(mediaEls.previewVideo);
    } else {
      videos.forEach((item) => mediaEls.previewVideo.appendChild(createPreviewCard(item, true)));
    }

    mediaEls.previewPhoto.hidden = mediaState.previewType !== 'photo';
    mediaEls.previewVideo.hidden = mediaState.previewType !== 'video';
  };

  const setTabState = (container, activeType) => {
    if (!container) return;
    container.querySelectorAll('.media-tab').forEach((button) => {
      const isActive = button.getAttribute('data-media-type') === activeType;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  const renderModalGrid = () => {
    if (!mediaEls.modalGrid) {
      return;
    }

    mediaEls.modalGrid.innerHTML = '';
    const items = mediaByType(mediaState.modalType);
    if (!items.length) {
      renderEmpty(mediaEls.modalGrid);
      return;
    }

    const isVideo = mediaState.modalType === 'video';
    items.forEach((item) => mediaEls.modalGrid.appendChild(createModalItem(item, isVideo)));
  };

  const openGalleryModal = () => {
    if (!mediaEls.modal) {
      return;
    }
    mediaEls.modal.hidden = false;
    document.body.classList.add('gallery-modal-open');
    renderModalGrid();
  };

  const closeGalleryModal = () => {
    if (!mediaEls.modal) {
      return;
    }
    mediaEls.modal.hidden = true;
    document.body.classList.remove('gallery-modal-open');
  };

  const openLightbox = (src, caption) => {
    if (!lightboxEls.root || !lightboxEls.image || !lightboxEls.caption) {
      return;
    }

    lightboxEls.image.src = src;
    lightboxEls.image.alt = caption || '';
    lightboxEls.caption.textContent = caption || '';
    lightboxEls.root.hidden = false;
    document.body.classList.add('lightbox-open');
  };

  const closeLightbox = () => {
    if (!lightboxEls.root) {
      return;
    }
    lightboxEls.root.hidden = true;
    document.body.classList.remove('lightbox-open');
    if (lightboxEls.image) {
      lightboxEls.image.removeAttribute('src');
    }
  };

  const initGallery = async () => {
    await loadMedia();
    renderPreview();

    if (mediaEls.tabs) {
      mediaEls.tabs.addEventListener('click', (event) => {
        const button = event.target.closest('.media-tab');
        if (!button) return;
        mediaState.previewType = button.getAttribute('data-media-type') || 'photo';
        setTabState(mediaEls.tabs, mediaState.previewType);
        renderPreview();
      });
    }

    if (mediaEls.modalTabs) {
      mediaEls.modalTabs.addEventListener('click', (event) => {
        const button = event.target.closest('.media-tab');
        if (!button) return;
        mediaState.modalType = button.getAttribute('data-media-type') || 'photo';
        setTabState(mediaEls.modalTabs, mediaState.modalType);
        renderModalGrid();
      });
    }

    mediaEls.openModalBtn?.addEventListener('click', () => {
      mediaState.modalType = mediaState.previewType;
      setTabState(mediaEls.modalTabs, mediaState.modalType);
      openGalleryModal();
    });

    mediaEls.modalClose?.addEventListener('click', closeGalleryModal);
    mediaEls.modalBackdrop?.addEventListener('click', closeGalleryModal);

    lightboxEls.close?.addEventListener('click', closeLightbox);
    lightboxEls.backdrop?.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (!lightboxEls.root?.hidden) {
        closeLightbox();
        return;
      }
      if (!mediaEls.modal?.hidden) {
        closeGalleryModal();
      }
    });
  };

  const applyLanguage = (lang) => {
    const safeLang = translations[lang] ? lang : 'ka';
    currentLang = safeLang;
    const pack = getPack();

    document.documentElement.lang = safeLang === 'ka' ? 'ka' : safeLang;

    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.getAttribute('data-i18n');
      if (!key || !Object.prototype.hasOwnProperty.call(pack, key)) {
        return;
      }
      node.textContent = pack[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.getAttribute('data-i18n-placeholder');
      if (!key || !Object.prototype.hasOwnProperty.call(pack, key)) {
        return;
      }
      node.setAttribute('placeholder', pack[key]);
    });

    const toggle = document.getElementById('langToggle');
    if (toggle) {
      toggle.textContent = langLabels[safeLang];
    }

    document.querySelectorAll('.lang-option').forEach((button) => {
      button.classList.toggle('active', button.getAttribute('data-lang') === safeLang);
    });

    try {
      localStorage.setItem('kizo_lang', safeLang);
    } catch (_error) {
      // ignore storage errors
    }

    renderPreview();
    renderModalGrid();
  };

  const initLanguageSwitcher = () => {
    const switcher = document.getElementById('langSwitcher');
    const toggle = document.getElementById('langToggle');
    const menu = document.getElementById('langMenu');

    if (!switcher || !toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.querySelectorAll('.lang-option').forEach((option) => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        applyLanguage(lang || 'ka');
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (event) => {
      if (switcher.contains(event.target)) {
        return;
      }
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });

    let storedLang = 'ka';
    try {
      storedLang = localStorage.getItem('kizo_lang') || 'ka';
    } catch (_error) {
      storedLang = 'ka';
    }
    applyLanguage(storedLang);
  };

  const initContactForm = () => {
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');
    if (!form || !status) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const pack = getPack();
      status.textContent = pack.form_status_loading;
      status.classList.remove('success', 'error');

      const formData = new FormData(form);
      const payload = {
        name: String(formData.get('name') || '').trim(),
        phone: String(formData.get('phone') || '').trim(),
        email: String(formData.get('email') || '').trim(),
        message: String(formData.get('message') || '').trim(),
        language: currentLang,
        pageUrl: window.location.href
      };

      try {
        const response = await fetch(config.contactEndpoint || '/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error('Contact submit failed');
        }

        status.textContent = pack.form_status_success;
        status.classList.add('success');
        form.reset();
      } catch (_error) {
        status.textContent = pack.form_status_error;
        status.classList.add('error');
      }
    });
  };

  const init = async () => {
    initReveals();
    initLanguageSwitcher();
    initContactForm();

    await initGallery();

    if (window.backgrounds && window.buttonEffects) {
      initInteractionAssets();
    }

    document.addEventListener('visibilitychange', () => {
      runtimes.forEach((runtime) => {
        if (!runtime) {
          return;
        }
        if (document.hidden) {
          runtime.stop && runtime.stop();
        } else {
          runtime.start && runtime.start();
        }
      });
    });

    window.addEventListener('beforeunload', () => {
      runtimes.forEach((runtime) => runtime && runtime.destroy && runtime.destroy());
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
