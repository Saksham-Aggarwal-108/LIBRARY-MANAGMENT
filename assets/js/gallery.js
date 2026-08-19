
document.addEventListener('DOMContentLoaded', () => {
  initLightbox();
});

function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const captionText = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close');

  if (!modal || !modalImg || !captionText) return;

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (!img) return;

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      modalImg.src = img.src;
      modalImg.alt = img.alt;
      captionText.textContent = img.getAttribute('data-desc') || img.alt;

      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    });
  });

  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeModal();
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target === modalImg.parentElement) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}
