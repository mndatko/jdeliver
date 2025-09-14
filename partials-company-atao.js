function checkCompany(signUpHint) {

    if(signUpHint === "ATAO") {
        const nextButton = document.getElementById('step1-nextButton-atao');
        const step1 = document.getElementById('step1-atao');
        const step2 = document.getElementById('step2');
        const errorP = document.getElementById('step1-error-atao');

        nextButton.addEventListener('click', async () => {
            const regEmailAddress = sessionStorage.getItem('registeringEmailAddress');
            const regUsername = sessionStorage.getItem('registeringUsername');
            if (regEmailAddress && regUsername)
            {
                try {
                    const response = await fetch('https://eu.dif.rexel.com/web/api/v1/registrations/user/exists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' },
                        body: JSON.stringify({ emailAddress: regEmailAddress, userName: regUsername })
                    });

                    if (response.ok) {                    
                        const userCheckJson = await response.json();
                        console.log("userCheckJson: ", userCheckJson);
                    } else {
                        const error = await response.json();
                        errorP.textContent = error.message || 'Validation failed.';
                        errorP.style.display = 'block';
                    }
                } catch (err) {
                    errorP.textContent = 'An unexpected error occurred.';
                    errorP.style.display = 'block';
                }               
            }

            const siretNumber = document.getElementById('siretNumber').value;
            if (siretNumber && regEmailAddress)
            {
                try {
                    const response = await fetch('https://eu.dif.rexel.com/web/api/v1/registrations/prospect/step/COMPANY_DETAILS', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' },
                        body: JSON.stringify({ email: regEmailAddress, emailForBot: null, chamberOfCommerceNumber: siretNumber, chamberOfCommerceNumberForBot: null, companyValidationRequired: true, gdprAgreement: true, step: "COMPANY_DETAILS"})
                    });
                    if (response.ok) {                    
                        const companyCheckJson = await response.json();
                        console.log("companyCheckJson: ", companyCheckJson);

                        if(companyCheckJson.companyExists){
                            // Sélection des éléments
                            const modalOverlay = document.getElementById('errorModal');
                            const closeModalButton = document.getElementById('closeModalButton');
                            const modalErrorMessage = document.getElementById('modalMessageContainer');

                            // Fonction MODIFIÉE pour ouvrir la modale avec un message d'erreur
                            function openErrorModal(message) {
                                // Met à jour le texte de la modale avec le message d'erreur spécifique
                                modalErrorMessage.innerHTML = message;
                                modalOverlay.classList.add('active');
                            }

                            // Fonction pour fermer la modale (inchangée)
                            function closeModal() {
                                modalOverlay.classList.remove('active');
                            }

                            // Ajout des écouteurs d'événements pour fermer la modale
                            closeModalButton.addEventListener('click', closeModal);
                            modalOverlay.addEventListener('click', function(event) {
                                if (event.target === modalOverlay) {
                                closeModal();
                                }
                            });
                            const errorMessage = `<p>To create a web login for this existing account, please contact your company's administrator and request the following information:</p> <ul><li>The account number</li><li>The postal code of the billing address</li></ul>`;
                            openErrorModal(errorMessage);
                        }
                    } else {
                        const error = await response.json();
                        errorP.textContent = error.message || 'Validation failed.';
                        errorP.style.display = 'block';
                    }
                } catch (err) {
                    errorP.textContent = 'An unexpected error occurred.';
                    errorP.style.display = 'block';
                }               
            }

        });
    }
    else {

        const nextButton = document.getElementById('nextButton');
        const step1 = document.getElementById('step1');
        const step2 = document.getElementById('step2');
        const errorP = document.getElementById('step1-error');

        const company = document.getElementById('company');
        const companyName = document.getElementById('company_name');
        const companyStreet = document.getElementById('company_street');
        const companyPostalCode = document.getElementById('company_postalcode');
        const companyCountry = document.getElementById('company_country');

        nextButton.addEventListener('click', async () => {
            const accountNumber = document.getElementById('accountNumber').value;
            const accountPostalCode = document.getElementById('accountPostalCode').value;

            if (accountNumber && accountPostalCode)
            {
                try {
                    const response = await fetch('https://eu.dif.rexel.com/web/api/v1/registrations/account/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' },
                        body: JSON.stringify({ accountNumberForExistingAccount: accountNumber, postalCodeForExistingAccount: accountPostalCode, "accountNumberForExistingAccountBot":null, "postalCodeForExistingAccountBot":null })
                    });

                    if (response.ok) {
                        
                        const companyJson = await response.json();
                        
                        companyName.textContent = companyJson.companyName;
                        companyStreet.textContent = companyJson.billingAddress.address1;
                        companyPostalCode.textContent = companyJson.billingAddress.postalCode + " " + companyJson.billingAddress.city;
                        companyCountry.textContent = getCountryName(companyJson.billingAddress.country);
                        company.style.display = 'block';

                        step1.style.display = 'none';
                        step2.style.display = 'block';
                        
                        const form = document.querySelector('form[data-form-primary="true"]');
                        if (!form) {
                            console.error(`Form not found.`);
                            return;
                        }

                        for (const child of form.children) {
                            if (child.tagName === 'DIV' && !child.id.startsWith('ulp-container-form-content-start')) {
                                child.style.display = '';
                            }
                        }
                    } else {
                        const error = await response.json();
                        errorP.textContent = error.message || 'Validation failed.';
                        errorP.style.display = 'block';
                    }
                } catch (err) {
                    errorP.textContent = 'An unexpected error occurred.';
                    errorP.style.display = 'block';
                }
            }
        });
    }
}
