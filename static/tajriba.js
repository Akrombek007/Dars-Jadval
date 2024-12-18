const ScheduleManager = {
    init() {
        this.courseSelect = document.getElementById('courseSelect');
        this.scheduleTableBody = document.getElementById('scheduleTableBody');
        this.modal = document.getElementById('modal');
        this.selectedCell = document.getElementById('selectedCell');
        this.roomSelect = document.getElementById('room');
        this.teacherSelect = document.getElementById('teacher');
        this.subjectSelect = document.getElementById('subject');
        this.bindEvents();
        this.loadInitialData(); // Load courses, rooms, teachers, and subjects
    },

    bindEvents() {
        this.courseSelect.addEventListener('change', this.handleCourseChange.bind(this));
        document.getElementById('saveData').addEventListener('click', this.saveData.bind(this));
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
    },

    async loadInitialData() {
        await this.loadCourses();
        await this.loadRooms();
        await this.loadTeachers();
        await this.loadSubjects();
    },

    async loadCourses() {
        const response = await fetch('/api/courses/for/groups');
        const courses = await response.json();
        this.populateDropdown(this.courseSelect, courses, 'Kursni tanlang...');
    },

    async loadRooms() {
        const response = await fetch('/api/rooms/');
        const rooms = await response.json();
        this.populateDropdown(this.roomSelect, rooms, 'Xona tanlang...');
    },

    async loadTeachers() {
        const response = await fetch('/api/teachers/');
        const teachers = await response.json();
        this.populateDropdown(this.teacherSelect, teachers, 'O‘qituvchi tanlang...');
    },

    async loadSubjects() {
        const response = await fetch('/api/subjects/');
        const subjects = await response.json();
        this.populateDropdown(this.subjectSelect, subjects, 'Fan tanlang...');
    },

    populateDropdown(selectElement, items, placeholder) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name || item.sciencename;
            selectElement.appendChild(option);
        });
    },

    async handleCourseChange(event) {
        const courseId = event.target.value;
        if (courseId) {
            try {
                const [groupsResponse, scheduleResponse] = await Promise.all([
                    fetch(`/api/schedule/${courseId}`),
                    fetch(`/api/schedule/table/${courseId}`)
                ]);
                const groups = await groupsResponse.json();
                const scheduleData = await scheduleResponse.json();

                if (groups.length > 0) {
                    this.renderSchedule(scheduleData, groups);
                } else {
                    alert("Guruhlar topilmadi!");
                    this.scheduleTableBody.innerHTML = ""; // Jadvalni tozalash
                }
            } catch (error) {
                console.error("Ma'lumotlarni olishda xatolik:", error);
                alert("Ma'lumotlarni olishda xatolik yuz berdi.");
            }
        }
    },

    renderSchedule(scheduleData, groups) {
        const daysOfWeek = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

        // Guruhlar jadvali uchun header yaratish
        this.createTableHeader(groups);

        // Jadvalni ma’lumotlar bilan to‘ldirish
        this.fillTableBody(scheduleData, groups, daysOfWeek);
    },

    createTableHeader(groups) {
        const headerRow = document.querySelector('thead tr');
        headerRow.innerHTML = '<th>Hafta kuni</th><th>№</th>'; // Asosiy ustunlar

        groups.forEach(group => {
            const th = document.createElement('th');
            th.textContent = group.name; // Guruh nomini ko‘rsatish
            th.className = 'py-2 px-4 text-xs border';
            headerRow.appendChild(th);
        });
    },

    fillTableBody(scheduleData, groups, daysOfWeek) {
        this.scheduleTableBody.innerHTML = ''; // Yangi jadvalni tozalash
        const dayColors = [
            'bg-blue-100',   // Dushanba
            'bg-yellow-100', // Seshanba
            'bg-green-100',  // Chorshanba
            'bg-blue-100',   // Payshanba
            'bg-red-200', // Juma
            'bg-blue-100'    // Shanba
        ];

        // Dars vaqtlarini ajratish uchun ranglar
        const timeSlotColors = [
            'bg-blue-00',   // 1-dars
            'bg-blue-200',   // 2-dars
            'bg-blue-300',   // 3-dars
            'bg-blue-400'    // 4-dars
        ];

        daysOfWeek.forEach((day, dayIndex) => {
            for (let timeSlot = 1; timeSlot <= 4; timeSlot++) {
                const row = document.createElement('tr');

                // Kunni faqat bir marta qo‘shish
                if (timeSlot === 1) {
                    const dayCell = document.createElement('td');
                    dayCell.textContent = day;
                    dayCell.rowSpan = 4;
                    dayCell.className = `py-3 px-6 border font-bold ${dayColors[dayIndex]}`;
                    row.appendChild(dayCell);
                }

                // Vaqt oralig‘i uchun yacheykani qo‘shish
                const timeSlotCell = document.createElement('td');
                timeSlotCell.textContent = `${timeSlot}-dars`;
                timeSlotCell.className = `py-3 px-6 border font-semibold text-gray-700 ${timeSlotColors[timeSlot - 1]}`;
                row.appendChild(timeSlotCell);

                // Guruhlar uchun yacheykalarni yaratish
                groups.forEach(group => {
                    const cell = document.createElement('td');
                    const cellData = scheduleData.find(item =>
                        item.day === dayIndex + 1 &&
                        item.time_slot === timeSlot &&
                        item.group.id === group.id
                    );

                    if (cellData) {
                        cell.innerHTML = `
                            <div><strong>Xona:</strong> ${cellData.room.name}</div>
                            <div><strong>O‘qituvchi:</strong> ${cellData.teacher.name}</div>
                            <div><strong>Fan:</strong> ${cellData.subject.name}</div>
                        `;
                        cell.classList.add('bg-green-100');
                    } else {
                        cell.innerHTML = `<div>Bo'sh</div>`;
                        cell.addEventListener('click', () =>
                            this.openModal(cell, day, timeSlot, group.id)
                        );
                    }

                    cell.className = 'py-3 px-6 border cursor-pointer';
                    row.appendChild(cell);
                });

                this.scheduleTableBody.appendChild(row);
            }
        });
    },

    openModal(cell, day, timeSlot, groupId) {
        this.selectedCell.value = `${day}-${timeSlot}-${groupId}`;
        this.modal.classList.remove('hidden');
    },

    closeModal() {
        this.modal.classList.add('hidden');
    },

    async saveData() {
        const [day, timeSlot, groupId] = this.selectedCell.value.split('-');
        const daysOfWeekNumber = {
            'Dushanba': 1,
            'Seshanba': 2,
            'Chorshanba': 3,
            'Payshanba': 4,
            'Juma': 5,
            'Shanba': 6
        };
        const dayNumber = daysOfWeekNumber[day];
        const courseId = this.courseSelect.value;

        const scheduleData = {
            course_id: parseInt(courseId),
            day: parseInt(dayNumber, 10),
            time_slot: parseInt(timeSlot),
            group_id: parseInt(groupId, 10),
            room_id: parseInt(this.roomSelect.value, 10),
            teacher_id: parseInt(this.teacherSelect.value, 10),
            subject_id: parseInt(this.subjectSelect.value, 10),
        };

        const response = await fetch('/api/schedule/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify([scheduleData]),
        });

        if (response.ok) {
            alert('Schedule saved successfully');
            this.closeModal();
        } else {
            alert('Failed to save schedule');
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    ScheduleManager.init();
});
