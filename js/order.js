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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = document.getElementById('orderSubmit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    const fd = new FormData();
    fd.append('fullName', form.fullName.value.trim());
    fd.append('email', form.email.value.trim());
    fd.append('songFor', form.songFor.value.trim());
    fd.append('occasion', occasionSelect.value);
    fd.append('style', form.style.value);
    fd.append('mood', form.mood.value);
    fd.append('length', lengthSelect.value);
    fd.append('lyrics', form.lyrics.value.trim());
    fd.append('details', form.details.value.trim());
    fd.append('commercialUse', commercialBox.checked);
    fd.append('plan', planSelect.value);
    if (fileInput.files.length) {
      fd.append('refAudio', fileInput.files[0]);
    }

    try {
      const res = await fetch(`${API_BASE}/api/orders`, { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong submitting your order.');
      }

      const orderSummary = {
        orderId: data.orderId,
        price: data.price,
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        songFor: form.songFor.value.trim(),
        occasionLabel: occasionSelect.selectedOptions[0].textContent,
        styleLabel: form.style.selectedOptions[0].textContent,
        moodLabel: form.mood.selectedOptions[0].textContent,
        lengthLabel: lengthSelect.selectedOptions[0].textContent,
        commercialUse: commercialBox.checked,
        plan: planSelect.value,
        planLabel: PLAN_LABELS[planSelect.value]
      };

      sessionStorage.setItem('noteplay_order', JSON.stringify(orderSummary));
      window.location.href = 'checkout.html';
    } catch (err) {
      alert(err.message || 'Could not submit your order. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Continue to Checkout →';
    }
  });
});
