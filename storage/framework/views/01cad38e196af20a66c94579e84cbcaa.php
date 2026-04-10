<script>
    document.addEventListener("DOMContentLoaded", function() {
        function setCookie(name, value, days) {
            let expires = "";
            if (days) {
                const date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toUTCString();
            }
            document.cookie = name + "=" + (value || "") + expires + "; path=/";
        }

        function getCookie(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i].trim();
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }

        function showConsentPopup() {
            const popup = document.createElement("div");
            popup.id = "gdpr-popup";
            popup.style.position = "fixed";
            popup.style.bottom = "10px";
            popup.style.right = "10px";
            popup.style.left = "10px";
            popup.style.maxWidth = "375px";
            popup.style.backgroundColor = "var(--neutral-100)";
            popup.style.border = "1px solid var(--neutral-800)";
            popup.style.padding = "20px";
            popup.style.zIndex = "10000";
            popup.style.borderRadius = "1rem";

            popup.innerHTML = `
                <h2 class="heading-2"><?php echo e(__('gdpr-consent::core.title')); ?></h2>
                <p class="margin-block-6">
                    <?php echo e(__('gdpr-consent::core.message')); ?>

                </p>
                <div class="grid-auto-fit" style="--min-item-size: 100px; --grid-gap: .5rem;">
                    <button class="button" data-type="primary" id="accept-gdpr"><?php echo e(__('gdpr-consent::core.accept')); ?></button>
                    <button class="button" data-type="accent" id="decline-gdpr"><?php echo e(__('gdpr-consent::core.refuse')); ?></button>
                </div>
                <div class="margin-block-start-3">
                    <a href="<?php echo e(route('page.show', $options['privacy-policy']->slug)); ?>" target="_blank"><?php echo e(__('gdpr-consent::core.more-info')); ?></a>
                </div>
            `;
            document.body.appendChild(popup);

            document.getElementById("accept-gdpr").addEventListener("click", function() {
                setCookie("gdpr_consent", "true", 182);
                document.body.removeChild(popup);
                window.dispatchEvent(new Event('gdpr:consent-given'));
            });

            document.getElementById("decline-gdpr").addEventListener("click", function() {
                setCookie("gdpr_consent", "false", 182);
                document.body.removeChild(popup);
            });
        }

        const consent = getCookie("gdpr_consent");
        if (consent === "true") {
            window.dispatchEvent(new Event('gdpr:consent-given'));
        } else if (consent === null) {
            showConsentPopup();
        }
    });
</script><?php /**PATH /var/www/vendor/netauratech/gdpr-consent/src/resources/views/script.blade.php ENDPATH**/ ?>