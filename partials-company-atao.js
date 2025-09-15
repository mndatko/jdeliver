function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkCompany(signUpHint) {

    if(signUpHint === "ATAO") {
        const nextButton = document.getElementById('step1-nextButton-atao');
        const step1 = document.getElementById('step1-atao');
        const step2 = document.getElementById('step2');
        const errorP = document.getElementById('step1-error-atao');
        var companyCheckUUUID = null;

        const loaderOverlay = document.getElementById('loaderOverlay');
        function showLoader() {
            loaderOverlay.classList.add('active');
        }
        function hideLoader() {
            loaderOverlay.classList.remove('active');
        }

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

                    showLoader();
                    nextButton.disabled = true;

                    var companyCheckStatus = "PENDING";
                    while(companyCheckStatus === "PENDING"){
                        const response = await fetch('https://eu.dif.rexel.com/web/api/v1/registrations/prospect/step/COMPANY_DETAILS', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' },
                            body: JSON.stringify({ id: companyCheckUUUID, email: regEmailAddress, emailForBot: null, chamberOfCommerceNumber: siretNumber, chamberOfCommerceNumberForBot: null, companyValidationRequired: true, gdprAgreement: true, step: "COMPANY_DETAILS"})
                        });
                        if (response.ok) {                    
                            const companyCheckJson = await response.json();
                            console.log("companyCheckJson: ", companyCheckJson);
                            companyCheckUUUID = companyCheckJson.id;
                            companyCheckStatus = companyCheckJson.registrationStatus || "PENDING";

                            if(companyCheckStatus === "IN_PROGRESS") {
                                if(companyCheckJson.companyExists === true){
                                    const modalOverlay = document.getElementById('errorModal');
                                    const closeModalButton = document.getElementById('closeModalButton');
                                    const modalErrorMessage = document.getElementById('modalMessageContainer');

                                    function openErrorModal(message) {
                                        modalErrorMessage.innerHTML = message;
                                        modalOverlay.classList.add('active');
                                    }

                                    function closeModal() {
                                        modalOverlay.classList.remove('active');
                                    }

                                    closeModalButton.addEventListener('click', closeModal);
                                    modalOverlay.addEventListener('click', function(event) {
                                        if (event.target === modalOverlay) {
                                        closeModal();
                                        }
                                    });
                                    const errorMessage = `<p>To create a web login for this existing account, please contact your company's administrator and request the following information:</p> <ul><li>The account number</li><li>The postal code of the billing address</li></ul>`;
                                    openErrorModal(errorMessage);
                                }
                                else if (companyCheckJson.companyExists === false) {
                                    try {
                                        var creditCheckStatus = "PENDING";
                                        while(creditCheckStatus === "PENDING") {
                                            const responseCreditCheck = await fetch('https://eu.dif.rexel.com/web/api/v1/registrations/prospect/step/CREDIT_CHECK', {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' },
                                                body: JSON.stringify({ id: companyCheckUUUID, step: "CREDIT_CHECK"})
                                            });
                                            
                                            if (responseCreditCheck.ok) {  
                                                const companyCreditCheckJson = await responseCreditCheck.json();
                                                console.log("companyCreditCheckJson: ", companyCreditCheckJson);
                                                creditCheckStatus = companyCreditCheckJson.registrationStatus || "PENDING";

                                                if(creditCheckStatus === "IN_PROGRESS") {
                                                    var questionsURL = `https://eu.dif.rexel.com/web/api/v1/registrations/prospect/${companyCheckUUUID}/company/questions`;
                                                    try {
                                                        const responseQuestionsCheck = await fetch(questionsURL, {
                                                            method: 'GET',
                                                            headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' }
                                                        });
                                                        
                                                        if (responseQuestionsCheck.ok) {  
                                                            const companyQuestionsCheckJson = await responseQuestionsCheck.json();
                                                            console.log("companyQuestionsCheckJson: ", companyQuestionsCheckJson);

                                                        } else {
                                                            const errorQuestionsCheck = await responseQuestionsCheck.json();
                                                            errorP.textContent = errorQuestionsCheck.message || 'Validation failed.';
                                                            errorP.style.display = 'block';
                                                        }
                                                    } catch (errCreditCheck) {
                                                        errorP.textContent = 'An unexpected error occurred.';
                                                        errorP.style.display = 'block';
                                                    }
                                                    finally {
                                                        hideLoader();
                                                        nextButton.disabled = false;
                                                    }  

                                                    step1.classList.add('visually-hidden');
                                                    step2.classList.remove('visually-hidden'); 
                                                    
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
                                                }
                                                else {
                                                    await sleep(1000);
                                                }
                                            } else {
                                                creditCheckStatus = "FAILED";
                                                const errorCreditCheck = await responseCreditCheck.json();
                                                errorP.textContent = errorCreditCheck.message || 'Validation failed.';
                                                errorP.style.display = 'block';
                                            }
                                        }
                                    } catch (errCreditCheck) {
                                        errorP.textContent = 'An unexpected error occurred.';
                                        errorP.style.display = 'block';
                                    } 
                                    finally {
                                        hideLoader();
                                        nextButton.disabled = false;
                                    } 
                                }
                                else{
                                }
                            }
                            else {
                                await sleep(1000);
                            }
                        } else {
                            companyCheckStatus = "FAILED";
                            const error = await response.json();
                            errorP.textContent = error.message || 'Validation failed.';
                            errorP.style.display = 'block';
                        }
                    }
                } catch (err) {
                    errorP.textContent = 'An unexpected error occurred.';
                    errorP.style.display = 'block';
                }
                finally {
                    hideLoader();
                    nextButton.disabled = false;
                }              
            }

        });
    }
    else {

        const nextButton = document.getElementById('nextButton');
        const step1 = document.getElementById('step1-etao');
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
                    /*const response = await fetch('https://eu.dif.rexel.com/web/api/v1/registrations/account/validate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-banner': 'frx' },
                        body: JSON.stringify({ accountNumberForExistingAccount: accountNumber, postalCodeForExistingAccount: accountPostalCode, "accountNumberForExistingAccountBot":null, "postalCodeForExistingAccountBot":null })
                    });*/

                    const sampleCompanyJson = {
                        "companyName": "Bâtiment SAS",
                        "billingAddress": {
                            "address1": "123 Rue de la République",
                            "postalCode": "75001",
                            "city": "PARIS",
                            "country": "FR"
                        }
                    };

                    const response = {
                        ok: true, 
                        json: async () => sampleCompanyJson
                    };

                    if (response.ok) {
                        
                        const companyJson = await response.json();
                        
                        companyName.textContent = companyJson.companyName;
                        companyStreet.textContent = companyJson.billingAddress.address1;
                        companyPostalCode.textContent = companyJson.billingAddress.postalCode + " " + companyJson.billingAddress.city;
                        companyCountry.textContent = getCountryName(companyJson.billingAddress.country);
                        company.style.display = 'block';

                        step1.classList.add('visually-hidden');
                        step2.classList.remove('visually-hidden'); 
                        
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
