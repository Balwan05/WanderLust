
(() => {
  'use strict';

  const forms = document.querySelectorAll('.needs-validation');

  Array.from(forms).forEach(form => {
    const commentField = form.querySelector('textarea[name="review[comment]"]');

    if (commentField) {
      const validateComment = () => {
        if (commentField.value.trim().length === 0) {
          commentField.setCustomValidity('Please add a few comments to your review.');
        } else {
          commentField.setCustomValidity('');
        }
      };

      commentField.addEventListener('input', validateComment);

      form.addEventListener('submit', validateComment);
    }

    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }

      form.classList.add('was-validated');
    }, false);
  });
})();
