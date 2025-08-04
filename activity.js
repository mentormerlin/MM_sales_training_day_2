// Activity page script for the jumbled order task with Google Sheets integration

document.addEventListener('DOMContentLoaded', () => {
    const tilesContainer = document.getElementById('tilesContainer');
    const submitButton = document.getElementById('submitActivity');
    const resultEl = document.getElementById('activityResult');

    // Start form elements
    const startBtn = document.getElementById('startActivityBtn');
    const nameInput = document.getElementById('activityName');
    const emailInput = document.getElementById('activityEmail');
    const startSection = document.getElementById('activity-start');
    const contentSection = document.getElementById('activity-content');

    // NMC steps
    const steps = [
        { id: 1, text: ' Apply for NMC eligibility with valid passport and nursing qualification' },
        { id: 2, text: ' Upload documents (passport, qualification, registration) and pay £140 application fee' },
        { id: 3, text: ' Upload proof of English Language proficiency (OET or IELTS or SIFE route)' },
        { id: 4, text: ' Receive NMC decision letter after document review (usually within 30 days)' },
        { id: 5, text: ' Pass the Computer-Based Test (CBT) – pay £83 (part A + B)' },
        { id: 6, text: ' Submit Health and Character declarations (PCC + Medical fitness)' },
        { id: 7, text: ' Book OSCE after getting UK offer letter and arriving in the UK' },
        { id: 8, text: ' Pass OSCE exam at test centre in UK – pay £794' },
        { id: 9, text: ' Pay £153 final registration fee after passing OSCE' },
        { id: 10, text: ' Submit referees (employer or academic) for NMC final verification' },
        { id: 11, text: ' Receive NMC PIN – You are now a registered nurse in the UK' }
    ];

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function initActivity() {
        tilesContainer.innerHTML = '';
        const shuffledSteps = shuffleArray([...steps]);
        shuffledSteps.forEach((step) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.draggable = true;
            tile.dataset.id = step.id;
            tile.textContent = step.text;
            tile.addEventListener('dragstart', handleDragStart);
            tile.addEventListener('dragend', handleDragEnd);
            tilesContainer.appendChild(tile);
        });
        tilesContainer.addEventListener('dragover', handleDragOver);
    }

    function handleDragStart(e) {
        if (e.target && e.target.classList.contains('tile')) {
            e.target.classList.add('dragging');
        }
    }

    function handleDragEnd(e) {
        if (e.target && e.target.classList.contains('tile')) {
            e.target.classList.remove('dragging');
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        const draggable = document.querySelector('.dragging');
        if (!draggable) return;
        const afterElement = getDragAfterElement(tilesContainer, e.clientY);
        if (afterElement == null) {
            tilesContainer.appendChild(draggable);
        } else {
            tilesContainer.insertBefore(draggable, afterElement);
        }
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.tile:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            if (!name || !email) {
                alert('Please enter your name and email to start the activity.');
                return;
            }
            sessionStorage.setItem('activity_userName', name);
            sessionStorage.setItem('activity_userEmail', email);
            startSection.classList.add('hidden');
            contentSection.classList.remove('hidden');
            initActivity();
        });
    }

    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const currentOrder = Array.from(tilesContainer.children).map((child) => parseInt(child.dataset.id, 10));
            const correctOrder = steps.map((step) => step.id);
            const isCorrect = arraysEqual(currentOrder, correctOrder);

            const name = sessionStorage.getItem('activity_userName');
            const email = sessionStorage.getItem('activity_userEmail');
            const timestamp = new Date().toISOString();
            const score = isCorrect ? correctOrder.length : 0;
            const percentage = ((score / correctOrder.length) * 100).toFixed(2);
            const status = isCorrect ? 'Passed' : 'Failed';

            const resultObj = {
                name,
                email,
                score,
                percentage,
                status,
                timestamp
            };

            if (isCorrect) {
                resultEl.textContent = '✅ Great job! You have successfully created the NMC process flow.';
                resultEl.className = 'activity-result success';
            } else {
                resultEl.textContent = '⚠️ Some steps are out of order. Please try again to complete the flow.';
                resultEl.className = 'activity-result error';
            }

            const confirmationEl = document.createElement('p');
            confirmationEl.style.marginTop = '1rem';
            confirmationEl.style.color = '#2e8b57';
            confirmationEl.style.fontWeight = '600';
            confirmationEl.textContent = '✅ Your result has been submitted.';
            resultEl.appendChild(confirmationEl);

            fetch('https://script.google.com/macros/s/AKfycbwk7LTCY8cMMH3L4OH1E4mFkktJ-B9xM4SAkSUleS_D0Q1cE2XmrcfhTfQHeMyUQnXl/exec', {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resultObj)
            }).catch(console.error);
        });
    }

    function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
});
