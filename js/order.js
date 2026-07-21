/* Order form behaviour — live summary, plan sync, handoff to checkout */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const planSelect = document.getElementById('plan');
  const commercialBox = document.getElementById('commercialUse');
  const lengthSelect = document.getElementById('length');
  const occasionSelect = document.getElementById('occasion');
  const fileInput = document.getElementById('refAudio');
  const fileLabelText = document.getElementById('fileDropText');
  const fileDropLabel = document.getElementById('fileDropLabel');

  const sumPlan = document.getElementById('sumPlan');
  const sumLength = document.getElementById('sumLength');
  const sumOccasion = document.getElementById('sumOccasion');
  const sumCommercial = document.getElementById('sumCommercial');
  const sumRevisions = document.getElementById('sumRevisions');
  const sumTotal = document.getElementById('sumTotal');

  const PLAN_LABELS = { basic: 'Basic', premium: 'Premium', commercial: 'Commercial License' };
  const PLAN_REVISIONS = { basic: '1', premium: '2', commercial: '2' };

  /* Preselect plan from ?plan= query string (linked from pricing cards) */
  const params = new URLSearchParams(window.location.search);
  const preselect = params.get('plan');
  if (preselect && PLAN_LABELS[preselect]) {
    planSelect.value = preselect;
  }

  function currentPrice() {
    const opt = planSelect.selectedOptions[0];
    return opt ? Number(opt.dataset.price) : 0;
  }

  function updateSummary() {
    const planKey = planSelect.value;
    sumPlan.textContent = PLAN_LABELS[planKey] || '—';
    sumRevisions.textContent = PLAN_REVISIONS[planKey] || '1';

    const lengthOpt = lengthSelect.selectedOptions[0];
    sumLength.textContent = lengthOpt && lengthOpt.value ? lengthOpt.textContent : '—';

    const occasionOpt = occasionSelect.selectedOptions[0];
    sumOccasion.textContent = occasionOpt && occasionOpt.value ? occasionOpt.textContent : '—';

    sumCommercial.textContent = commercialBox.checked ? 'Yes' : 'No';

    const price = currentPrice();
    sumTotal.textContent = '$' + price.toFixed(2);
  }

  /* If commercial use is checked, force the Commercial License plan */
  commercialBox.addEventListener('change', () => {
    if (commercialBox.checked) {
      planSelect.value = 'commercial';
    }
    updateSummary();
  });

  planSelect.addEventListener('change', () => {
    if (planSelect.value !== 'commercial') {
      commercialBox.checked = false;
    }
    updateSummary();
  });

  [lengthSelect, occasionSelect].forEach(el => el.addEventListener('change', updateSummary));

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      fileLabelText.textContent = '✓ ' + fileInput.files[0].name;
      fileDropLabel.classList.add('has-file');
    } else {
      fileLabelText.textContent = 'Click to upload or drag an MP3 / WAV here (max 20MB)';
      fileDropLabel.classList.remove('has-file');
    }
  });

  updateSummary();

  /* ---- Submit: package order data and hand off to checkout ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const order = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      songFor: form.songFor.value.trim(),
      occasion: occasionSelect.value,
      occasionLabel: occasionSelect.selectedOptions[0].textContent,
      style: form.style.value,
      styleLabel: form.style.selectedOptions[0].textContent,
      mood: form.mood.value,
      moodLabel: form.mood.selectedOptions[0].textContent,
      length: lengthSelect.value,
      lengthLabel: lengthSelect.selectedOptions[0].textContent,
      lyrics: form.lyrics.value.trim(),
      details: form.details.value.trim(),
      commercialUse: commercialBox.checked,
      plan: planSelect.value,
      planLabel: PLAN_LABELS[planSelect.value],
      price: currentPrice(),
      revisions: PLAN_REVISIONS[planSelect.value],
      referenceFileName: fileInput.files.length ? fileInput.files[0].name : null,
      createdAt: new Date().toISOString()
    };

    // In production this file would be uploaded to storage (e.g. S3) via
    // the backend before checkout. Here we only carry its name forward.
    sessionStorage.setItem('noteplay_order', JSON.stringify(order));
    window.location.href = 'checkout.html';
  });
});
