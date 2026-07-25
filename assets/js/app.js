/* MVP Falcon Unit — site behavior with PHP/CSV backend */

const SUBMIT_URL = 'backend/submit_lead.php';

/* ---------- Mobile menu ---------- */
function toggleMenu() {
  const nav = document.getElementById('navLinksMobile');
  const icon = document.getElementById('menuIcon');
  const btn = document.getElementById('menuBtn');
  const isHidden = nav.classList.contains('hidden');
  nav.classList.toggle('hidden');
  nav.classList.toggle('flex');
  icon.textContent = isHidden ? '✕' : '☰';
  btn.setAttribute('aria-expanded', String(isHidden));
}
function closeMenu() {
  const nav = document.getElementById('navLinksMobile');
  const icon = document.getElementById('menuIcon');
  const btn = document.getElementById('menuBtn');
  nav.classList.add('hidden');
  nav.classList.remove('flex');
  icon.textContent = '☰';
  btn.setAttribute('aria-expanded', 'false');
}

/* ---------- Form tabs ---------- */
function showForm(id, btn) {
  document.querySelectorAll('.formbox').forEach(f => f.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('tab-active');
    t.classList.add('tab-inactive');
  });
  if (btn) {
    btn.classList.remove('tab-inactive');
    btn.classList.add('tab-active');
  }

  document.getElementById('msg').textContent = '';
}

/* ---------- Handle all three forms with PHP/CSV backend ---------- */
document.querySelectorAll('.formbox').forEach(form => {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const data = new FormData(form);

    const msgEl = document.getElementById('msg');
    msgEl.textContent = 'Submitting...';

    data.append('type', form.dataset.type);

    try {
      fetch(SUBMIT_URL, {
        method: 'POST',
        body: data
      })
        .then(async res => {
          const contentType = res.headers.get('content-type') || '';
          const rawText = await res.text();

          if (contentType.includes('application/json')) {
            try {
              return JSON.parse(rawText);
            } catch {
              return { success: false, message: 'Server returned malformed response. Please try again.', _raw: rawText };
            }
          }

          const plainMsg = rawText.replace(/<[^>]*>/g, '').trim();
          const snippet = plainMsg.length > 120 ? plainMsg.substring(0, 120) + '...' : plainMsg;
          return {
            success: false,
            message: snippet ? 'Server error: ' + snippet : 'Server returned an invalid response. Please try again.',
            _raw: rawText
          };
        })
        .then(result => {
          if (result.success) {
            submitSuccess(form, data.get('name'), msgEl);
          } else {
            msgEl.textContent = 'Error: ' + (result.message || 'Submission failed.');
            if (result._raw) console.error('Raw server response:', result._raw);
          }
        })
        .catch(error => {
          msgEl.textContent = 'Network error. Please try again: ' + error.message;
          console.error('Form submission error:', error);
        });
    } catch (error) {
      msgEl.textContent = 'Error submitting form: ' + error.message;
      console.error('Form submission error:', error);
    }
  });
});

function submitSuccess(form, name, msgEl) {
  const thankYouName = name || 'there';
  msgEl.textContent = `Thank you, ${thankYouName}! Your ${form.dataset.type.toLowerCase()} was received. Sandy will reach out shortly.`;
  form.reset();
}

/* ---------- Product image preview ---------- */
function openProductImage(src, alt) {
  const modal = document.getElementById('productImageModal');
  const img = document.getElementById('productImageModalImg');
  if (!modal || !img) return;
  img.src = src;
  img.alt = alt;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeProductImage() {
  const modal = document.getElementById('productImageModal');
  const img = document.getElementById('productImageModalImg');
  if (!modal || !img) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  img.src = '';
  img.alt = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProductImage();
});
