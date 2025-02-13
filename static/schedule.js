const ScheduleManager = {
    init() {
        this.courseSelect = document.getElementById('courseSelect');
        this.scheduleTableBody = document.getElementById('scheduleTableBody');
        this.modal = document.getElementById('modal');
        this.selectedCell = document.getElementById('selectedCell');
        this.roomSelect = document.getElementById('room');
        this.teacherSelect = document.getElementById('teacher');
        this.subjectSelect = document.getElementById('subject');
        this.additionalGroupsSelect = document.getElementById('additionalGroups');
        this.saveDataButton = document.getElementById('saveData');
        this.updateDataButton = document.getElementById('updateData');
        this.deleteDataButton = document.getElementById('deleteData');
        this.toggleGroupsButton = document.getElementById('toggleGroups');
        this.groupSelectionContent = document.getElementById('groupSelectionContent');
        this.bindEvents();
        this.loadInitialData();
    },

    bindEvents() {
        this.courseSelect.addEventListener('change', this.handleCourseChange.bind(this));
        this.saveDataButton.addEventListener('click', this.saveData.bind(this));
        this.updateDataButton.addEventListener('click', this.updateData.bind(this));
        this.deleteDataButton.addEventListener('click', this.deleteData.bind(this));
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
        this.toggleGroupsButton.addEventListener('click', this.toggleGroupSelection.bind(this));
    },

    toggleGroupSelection() {
        this.groupSelectionContent.classList.toggle('show');
        const isExpanded = this.groupSelectionContent.classList.contains('show');
        this.toggleGroupsButton.setAttribute('aria-expanded', isExpanded);
    },

    async loadInitialData() {
        await this.loadCourses();
    },

    async loadCourses() {
        const response = await fetch('/api/courses/for/groups');
        const courses = await response.json();
        this.populateDropdown(this.courseSelect, courses, 'Kursni tanlang...');
    },

    async loadGroups(courseId, excludeGroupId = null) {
        try {
            const response = await fetch(`/api/schedule/${courseId}`);
            const groups = await response.json();

            // Filter out the current group if provided
            const availableGroups = excludeGroupId
                ? groups.filter(group => group.id !== parseInt(excludeGroupId))
                : groups;

            // Populate the additional groups dropdown
            this.additionalGroupsSelect.innerHTML = '';
            availableGroups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                this.additionalGroupsSelect.appendChild(option);
            });

            return groups;
        } catch (error) {
            console.error('Error loading groups:', error);
            this.showToast('Guruhlarni yuklashda xatolik', 'error');
            return [];
        }
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
            this.showToast('O\'qituvchilarni yuklashda xatolik', 'error');
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
            this.showToast('Xonalarni yuklashda xatolik', 'error');
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
            this.showToast('Fanlarni yuklashda xatolik', 'error');
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
                    this.showToast("Guruhlar topilmadi!", "error");
                    this.scheduleTableBody.innerHTML = "";
                }
            } catch (error) {
                console.error("Ma'lumotlarni olishda xatolik:", error);
                this.showToast("Ma'lumotlarni olishda xatolik yuz berdi.", "error");
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
        this.setLoading(true);
        this.selectedCell.value = `${day}-${timeSlot}-${groupId}`;

        // Initialize select2 for all dropdowns
        $(this.roomSelect).select2({
            placeholder: 'Xona tanlang...',
            allowClear: true,
            width: '100%',
            dropdownParent: this.modal
        });

        $(this.teacherSelect).select2({
            placeholder: 'O\'qituvchi tanlang...',
            allowClear: true,
            width: '100%',
            dropdownParent: this.modal
        });

        $(this.subjectSelect).select2({
            placeholder: 'Fan tanlang...',
            allowClear: true,
            width: '100%',
            dropdownParent: this.modal
        });

        // Initialize select2 for additional groups
        $(this.additionalGroupsSelect).select2({
            placeholder: 'Guruhlarni tanlang...',
            allowClear: true,
            multiple: true,
            width: '100%',
            dropdownParent: this.modal
        });

        // Initialize tooltips
        tippy('[data-tippy-content]', {
            placement: 'top-start',
            animation: 'scale',
            theme: 'light'
        });

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

        try {
            // Load all necessary data
            await Promise.all([
                this.loadAvailableTeachers(dayNumber, timeSlot),
                this.loadAvailableRooms(dayNumber, timeSlot),
                this.loadSubjects(courseId),
                this.loadGroups(courseId, groupId)
            ]);

            if (cellData) {
                this.roomSelect.value = cellData.room.id;
                this.teacherSelect.value = cellData.teacher.id;
                this.subjectSelect.value = cellData.subject.id;
                this.saveDataButton.style.display = 'none';
                this.updateDataButton.style.display = 'flex';
                this.deleteDataButton.style.display = 'flex';
                this.toggleGroupsButton.style.display = 'none';
                this.groupSelectionContent.classList.remove('show');
            } else {
                this.roomSelect.value = '';
                this.teacherSelect.value = '';
                this.subjectSelect.value = '';
                this.additionalGroupsSelect.value = [];
                this.saveDataButton.style.display = 'flex';
                this.updateDataButton.style.display = 'none';
                this.deleteDataButton.style.display = 'none';
                this.toggleGroupsButton.style.display = 'block';
            }

            // Trigger select2 updates
            $(this.roomSelect).trigger('change');
            $(this.teacherSelect).trigger('change');
            $(this.subjectSelect).trigger('change');
            $(this.additionalGroupsSelect).trigger('change');

            this.modal.classList.remove('hidden');
            setTimeout(() => {
                this.modal.classList.add('active');
            }, 50);

        } catch (error) {
            this.showToast('Xatolik yuz berdi', 'error');
        } finally {
            this.setLoading(false);
        }
    },

    closeModal() {
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.classList.add('hidden');

            // Reset group selection
            this.groupSelectionContent.classList.remove('show');

            // Destroy all select2 instances
            $(this.roomSelect).select2('destroy');
            $(this.teacherSelect).select2('destroy');
            $(this.subjectSelect).select2('destroy');
            $(this.additionalGroupsSelect).select2('destroy');
        }, 300);
    },

    setLoading(loading) {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.disabled = loading;
            if (loading) {
                const originalContent = button.innerHTML;
                button.setAttribute('data-original-content', originalContent);
                button.innerHTML = `
                    <div class="loading-spinner"></div>
                    <span>Yuklanmoqda...</span>
                `;
            } else {
                const originalContent = button.getAttribute('data-original-content');
                if (originalContent) {
                    button.innerHTML = originalContent;
                }
            }
        });
    },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`;
        toast.innerHTML = `
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    ${type === 'error' 
                        ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd">'
                        : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd">'
                    }
                </svg>
                ${message}
            </div>
        `;

        document.getElementById('toastContainer').appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    async saveData() {
        const [day, timeSlot, groupId] = this.selectedCell.value.split('-');
        const daysOfWeekNumber = {
            'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3,
            'Payshanba': 4, 'Juma': 5, 'Shanba': 6
        };
        const dayNumber = daysOfWeekNumber[day];
        const courseId = this.courseSelect.value;

        // Create base schedule data
        const baseScheduleData = {
            course_id: parseInt(courseId),
            day: parseInt(dayNumber, 10),
            time_slot: parseInt(timeSlot),
            room_id: parseInt(this.roomSelect.value, 10),
            teacher_id: parseInt(this.teacherSelect.value, 10),
            subject_id: parseInt(this.subjectSelect.value, 10),
        };

        // Get selected additional groups
        const additionalGroupIds = $(this.additionalGroupsSelect).val() || [];

        // Create schedule data array including main group and additional groups
        const scheduleDataArray = [
            { ...baseScheduleData, group_id: parseInt(groupId, 10) },
            ...additionalGroupIds.map(additionalGroupId => ({
                ...baseScheduleData,
                group_id: parseInt(additionalGroupId, 10)
            }))
        ];

        try {
            const response = await fetch('/api/schedule/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(scheduleDataArray),
            });

            if (response.ok) {
                this.showToast('Dars jadvali muvaffaqiyatli saqlandi');
                this.closeModal();
                await this.handleCourseChange({ target: { value: courseId } });
            } else {
                throw new Error('Dars jadvalini saqlashda xatolik yuz berdi');
            }
        } catch (error) {
            console.error('Xatolik:', error);
            this.showToast(error.message, 'error');
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
                this.showToast('Dars jadvali muvaffaqiyatli yangilandi');
                this.closeModal();
                await this.handleCourseChange({ target: { value: courseId } });
            } else {
                throw new Error('Dars jadvalini yangilashda xatolik yuz berdi');
            }
        } catch (error) {
            console.error('Xatolik:', error);
            this.showToast(error.message, 'error');
        }
    },

    async deleteData() {
        const [day, timeSlot, groupId] = this.selectedCell.value.split('-');
        const daysOfWeekNumber = {
            'Dushanba': 1, 'Seshanba': 2, 'Chorshanba': 3,
            'Payshanba': 4, 'Juma': 5, 'Shanba': 6
        };
        const dayNumber = daysOfWeekNumber[day];
        const courseId = this.courseSelect.value;

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
                method: 'DELETE',
            });

            if (response.ok) {
                this.showToast('Dars jadvali muvaffaqiyatli o\'chirildi');
                this.closeModal();
                await this.handleCourseChange({ target: { value: courseId } });
            } else {
                throw new Error('Dars jadvalini o\'chirishda xatolik yuz berdi');
            }
        } catch (error) {
            console.error('Xatolik:', error);
            this.showToast(error.message, 'error');
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    ScheduleManager.init();
});

