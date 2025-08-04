// Activity page script for the jumbled order task

/*
 * A simple drag‑and‑drop sortable list implementation.  The activity
 * presents a series of steps in random order.  The trainee must drag
 * the tiles into the correct chronological order and submit their
 * arrangement.  Feedback is provided without reloading the page.
 */

document.addEventListener('DOMContentLoaded', () => {
    const tilesContainer = document.getElementById('tilesContainer');
    const submitButton = document.getElementById('submitActivity');
    const resultEl = document.getElementById('activityResult');

    // Elements for the start form
    const startBtn = document.getElementById('startActivityBtn');
    const nameInput = document.getElementById('activityName');
    const emailInput = document.getElementById('activityEmail');
    const startSection = document.getElementById('activity-start');
    const contentSection = document.getElementById('activity-content');

    // Define the steps in their correct order for the NMC process flow.
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

    // Shuffle helper (Fisher‑Yates)
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Render and initialise the tiles. Called once after the user starts the activity.
    function initActivity() {
        // Clear any existing tiles
        tilesContainer.innerHTML = '';
        // Shuffle the steps so the starting order is random
        const shuffledSteps = shuffleArray([...steps]);
        shuffledSteps.forEach((step) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.draggable = true;
            tile.dataset.id = step.id;
            tile.textContent = step.text;
            // Attach drag handlers for each tile
            tile.addEventListener('dragstart', handleDragStart);
            tile.addEventListener('dragend', handleDragEnd);
            tilesContainer.appendChild(tile);
        });
        // Attach dragover handler to the container (only once per init)
        tilesContainer.addEventListener('dragover', handleDragOver);
    }

    // Drag and drop handlers
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

    // Determine the element to insert before based on cursor position
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

    // Start button handler: validates input, stores details and shows the activity
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            if (!name || !email) {
                alert('Please enter your name and email to start the activity.');
                return;
            }
            // Optionally store the values for later use
            sessionStorage.setItem('activity_userName', name);
            sessionStorage.setItem('activity_userEmail', email);
            // Hide the start section and show the activity content
            startSection.classList.add('hidden');
            contentSection.classList.remove('hidden');
            // Initialize the activity tiles
            initActivity();
        });
    }

    // When the user submits, compare the current order to the correct one
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const currentOrder = Array.from(tilesContainer.children).map((child) => parseInt(child.dataset.id, 10));
            const correctOrder = steps.map((step) => step.id);
            if (arraysEqual(currentOrder, correctOrder)) {
                resultEl.textContent = 'Great job! You have successfully created the NMC process flow.';
                resultEl.className = 'activity-result success';
            } else {
                resultEl.textContent = 'Some steps are out of order. Please try again to complete the flow.';
                resultEl.className = 'activity-result error';
            }
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
