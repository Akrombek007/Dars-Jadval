const ScheduleManager = {
    init() {
        this.courseSelect = document.getElementById('courseSelect');
        this.scheduleTableBody = document.getElementById('scheduleTableBody');
        this.modal = document.getElementById('modal');
        this.selectedCell = document.getElementById('selectedCell');
        this.roomSelect = document.getElementById('room');
        this.teacherSelect = document.getElementById('teacher');
        this.subjectSelect = document.getElementById('subject');
        this.saveDataButton = document.getElementById('saveData');
        this.updateDataButton = document.getElementById('updateData');
        this.bindEvents();
        this.loadInitialData();
    },

    bindEvents() {
        this.courseSelect.addEventListener('change', this.handleCourseChange.bind(this));
        this.saveDataButton.addEventListener('click', this.saveData.bind(this));
        this.updateDataButton.addEventListener('click', this.updateData.bind(this));
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
    },

    async loadInitialData() {
        await this.loadCourses();
    },

    async loadCourses() {
        const response = await fetch('/api/courses/for/groups');
        const courses = await response.json();
        this.populateDropdown(this.courseSelect, courses, 'Kursni tanlang...');
    },

    async loadAvailableTeachers(dayNumber, timeSlot) {
        try {
            const response = await fetch(`/api/available-teachers/?day=${dayNumber}&time_slot=${timeSlot}`);
            const teachers = await response.json();

            if (Array.isArray(teachers)) {
                this.populateDropdown(this.teacherSelect, teachers, 'O\'qituvchi tanlang...');
            } else {
                this.teacherSelect.innerHTML = '<option value="">Bo\'sh o\'qituvchilar yo\'q</option>';
            }
        } catch (error) {
            console.error('Error loading available teachers:', error);
            alert('O\'qituvchilarni yuklashda xatolik');
        }
    },

    async loadAvailableRooms(dayNumber, timeSlot) {
        try {
            const response = await fetch(`/api/available-rooms/?day=${dayNumber}&time_slot=${timeSlot}`);
            const rooms = await response.json();

            if (Array.isArray(rooms)) {
                this.populateDropdown(this.roomSelect, rooms, 'Xona tanlang...');
            } else {
                this.roomSelect.innerHTML = '<option value="">Bo\'sh xonalar yo\'q</option>';
            }
        } catch (error) {
            console.error('Error loading available rooms:', error);
            alert('Xonalarni yuklashda xatolik');
        }
    },

    async loadSubjects(courseId) {
        try {
            const response = await fetch(`/api/schedule/subjects/${courseId}`);
            const subjects = await response.json();
            if (Array.isArray(subjects)) {
                this.populateDropdown(this.subjectSelect, subjects, 'Fan tanlang...');
            } else {
                this.subjectSelect.innerHTML = '<option value="">Fanlar topilmadi</option>';
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
            alert('Fanlarni yuklashda xatolik');
        }
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
                    this.scheduleTableBody.innerHTML = "";
                }
            } catch (error) {
                console.error("Ma'lumotlarni olishda xatolik:", error);
                alert("Ma'lumotlarni olishda xatolik yuz berdi.");
            }
        }
    },

    renderSchedule(scheduleData, groups) {
        const daysOfWeek = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        this.createTableHeader(groups);
        this.fillTableBody(scheduleData, groups, daysOfWeek);
    },

    createTableHeader(groups) {
        const headerRow = document.querySelector('thead tr');
        headerRow.innerHTML = `
            <th class="py-5 px-6 text-sm font-semibold border-r border-white border-opacity-30">Hafta kuni</th>
            <th class="py-5 px-2 text-sm font-semibold border-r border-white border-opacity-30">№</th>
        `;

        groups.forEach(group => {
            const th = document.createElement('th');
            th.className = 'py-5 px-4 text-sm font-semibold border-r border-white border-opacity-30 last:border-r-0';
            th.innerHTML = `<div class="inline-block text-center min-w-[100px] bg-white bg-opacity-20 rounded-lg p-2">${group.name}</div>`;
            headerRow.appendChild(th);
        });
    },

    fillTableBody(scheduleData, groups, daysOfWeek) {
        this.scheduleTableBody.innerHTML = '';
        const dayColors = [
            'from-blue-300 to-indigo-400',
            'from-green-300 to-teal-400',
            'from-yellow-300 to-orange-400',
            'from-red-300 to-pink-400',
            'from-purple-300 to-indigo-400',
            'from-pink-300 to-red-400'
        ];

        daysOfWeek.forEach((day, dayIndex) => {
            for (let timeSlot = 1; timeSlot <= 4; timeSlot++) {
                const row = document.createElement('tr');
                row.className = 'transition-colors hover:bg-white hover:bg-opacity-10';

                if (timeSlot === 1) {
                    const dayCell = document.createElement('td');
                    dayCell.textContent = day;
                    dayCell.rowSpan = 4;
                    dayCell.className = `py-4 px-6 border-r border-white border-opacity-30 font-bold text-lg bg-gradient-to-r ${dayColors[dayIndex]}`;
                    row.appendChild(dayCell);
                }

                const timeSlotCell = document.createElement('td');
                timeSlotCell.textContent = `${timeSlot}`;
                timeSlotCell.className = 'py-4 px-4 border-r border-white border-opacity-30 font-medium';
                row.appendChild(timeSlotCell);

                groups.forEach(group => {
                    const cell = document.createElement('td');
                    const cellData = scheduleData.find(item =>
                        item.day === dayIndex + 1 &&
                        item.time_slot === timeSlot &&
                        item.group.id === group.id
                    );

                    if (cellData) {
                        cell.innerHTML = this.createCellContent(cellData);
                    } else {
                        cell.innerHTML = `
                            <div class="schedule-cell p-3 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-40 transition-colors cursor-pointer">
                                <div class="text-sm italic text-indigo-700">Bo'sh</div>
                            </div>
                        `;
                    }

                    cell.className = 'border-r border-white border-opacity-30 last:border-r-0 p-2';
                    cell.addEventListener('click', () => this.openModal(cell, day, timeSlot, group.id, cellData));
                    row.appendChild(cell);
                });

                this.scheduleTableBody.appendChild(row);
            }
        });
    },

    createCellContent(cellData) {
        return `
            <div class="schedule-cell p-3 rounded-lg bg-white bg-opacity-40 shadow-lg">
                <div class="font-medium text-sm mb-1">
                    <span class="text-indigo-700 font-semibold">O'qituvchi:</span> ${cellData.teacher.name}
                </div>
                <div class="font-medium text-sm mb-1">
                    <span class="text-indigo-700 font-semibold">Fan:</span> ${cellData.subject.name}
                </div>
                <div class="font-medium text-sm">
                    <span class="text-indigo-700 font-semibold">Xona:</span> ${cellData.room.name}
                </div>
            </div>
        `;
    },

    async openModal(cell, day, timeSlot, groupId, cellData) {
        this.selectedCell.value = `${day}-${timeSlot}-${groupId}`;

        // Convert day name to number for API calls
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

        // Load available data for this time slot
        await Promise.all([
            this.loadAvailableTeachers(dayNumber, timeSlot),
            this.loadAvailableRooms(dayNumber, timeSlot),
            this.loadSubjects(courseId)
        ]);

        if (cellData) {
            this.roomSelect.value = cellData.room.id;
            this.teacherSelect.value = cellData.teacher.id;
            this.subjectSelect.value = cellData.subject.id;
            this.saveDataButton.style.display = 'none';
            this.updateDataButton.style.display = 'block';
        } else {
            this.roomSelect.value = '';
            this.teacherSelect.value = '';
            this.subjectSelect.value = '';
            this.saveDataButton.style.display = 'block';
            this.updateDataButton.style.display = 'none';
        }

        this.modal.classList.remove('hidden');
    },

    closeModal() {
        this.modal.classList.add('hidden');
    },

    async saveData() {
        const [day, timeSlot, groupId] = this.selectedCell.value.split('-');
        const daysOfWeekNumber = {
            'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3,
            'Payshanba': 4, 'Juma': 5, 'Shanba': 6
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

        try {
            const response = await fetch('/api/schedule/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify([scheduleData]),
            });

            if (response.ok) {
                alert('Dars jadvali muvaffaqiyatli saqlandi');
                this.closeModal();
                await this.handleCourseChange({ target: { value: courseId } });
            } else {
                throw new Error('Dars jadvalini saqlashda xatolik yuz berdi');
            }
        } catch (error) {
            console.error('Xatolik:', error);
            alert(error.message);
        }
    },

    async updateData() {
        const [day, timeSlot, groupId] = this.selectedCell.value.split('-');
        const daysOfWeekNumber = {
            'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3,
            'Payshanba': 4, 'Juma': 5, 'Shanba': 6
        };
        const dayNumber = daysOfWeekNumber[day];
        const courseId = this.courseSelect.value;

        const updatedData = {
            room_id: parseInt(this.roomSelect.value, 10),
            teacher_id: parseInt(this.teacherSelect.value, 10),
            subject_id: parseInt(this.subjectSelect.value, 10),
        };

        try {
            const scheduleResponse = await fetch(`/api/schedule/table/${courseId}`);
            const scheduleData = await scheduleResponse.json();
            const existingSchedule = scheduleData.find(item =>
                item.day === parseInt(dayNumber, 10) &&
                item.time_slot === parseInt(timeSlot, 10) &&
                item.group.id === parseInt(groupId, 10)
            );

            if (!existingSchedule) {
                throw new Error('Mavjud bolmagan dars jadvali');
            }

            const response = await fetch(`/api/schedule/${existingSchedule.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                alert('Dars jadvali muvaffaqiyatli yangilandi');
                this.closeModal();
                await this.handleCourseChange({ target: { value: courseId } });
            } else {
                throw new Error('Dars jadvalini yangilashda xatolik yuz berdi');
            }
        } catch (error) {
            console.error('Xatolik:', error);
            alert(error.message);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    ScheduleManager.init();
});

