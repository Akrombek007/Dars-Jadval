const GroupsManager = {
    init() {
        this.courseSelect = document.getElementById('courseSelect');
        this.scheduleTableBody = document.getElementById('scheduleTableBody');
        this.modal = document.getElementById('modal');
        this.selectedCell = document.getElementById('selectedCell');
        this.roomSelect = document.getElementById('room');
        this.teacherSelect = document.getElementById('teacher');
        this.subjectSelect = document.getElementById('subject');
        this.loadCourses(); // Start loading courses
        this.loadRooms();    // Start loading rooms
        this.loadTeachers(); // Start loading teachers
        this.loadSubjects(); // Start loading subjects
        this.bindEvents();
    },

    bindEvents() {
        this.courseSelect.addEventListener('change', this.handleCourseChange.bind(this));
        document.getElementById('saveData').addEventListener('click', this.saveData.bind(this));
        document.getElementById('closeModal').addEventListener('click', this.closeModal.bind(this));
    },

    async loadCourses() {
        try {
            const response = await fetch('/api/courses/for/groups');
            if (response.ok) {
                const courses = await response.json();
                this.populateCoursesDropdown(courses);
            } else {
                throw new Error('Error loading courses.');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            alert('An error occurred while loading the courses.');
        }
    },

    populateCoursesDropdown(courses) {
        this.courseSelect.innerHTML = '<option value="">Kursni tanlang...</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            this.courseSelect.appendChild(option);
        });
    },

    async loadRooms() {
        try {
            const response = await fetch('/api/rooms/');
            if (response.ok) {
                const rooms = await response.json();
                this.populateRoomDropdown(rooms);
            } else {
                throw new Error('Error loading rooms.');
            }
        } catch (error) {
            console.error('Error loading rooms:', error);
        }
    },

    populateRoomDropdown(rooms) {
        this.roomSelect.innerHTML = '<option value="">Xona tanlang...</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = room.name;
            this.roomSelect.appendChild(option);
        });
    },

    async loadTeachers() {
        try {
            const response = await fetch('/api/teachers/');
            if (response.ok) {
                const teachers = await response.json();
                this.populateTeacherDropdown(teachers);
            } else {
                throw new Error('Error loading teachers.');
            }
        } catch (error) {
            console.error('Error loading teachers:', error);
        }
    },

    populateTeacherDropdown(teachers) {
        this.teacherSelect.innerHTML = '<option value="">O\'qituvchi tanlang...</option>';
        teachers.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} - ${teacher.sciencename}`;
            this.teacherSelect.appendChild(option);
        });
    },

    async loadSubjects() {
        try {
            const response = await fetch('/api/subjects/');
            if (response.ok) {
                const subjects = await response.json();
                this.populateSubjectDropdown(subjects);
            } else {
                throw new Error('Error loading subjects.');
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    },

    populateSubjectDropdown(subjects) {
        this.subjectSelect.innerHTML = '<option value="">Fan tanlang...</option>';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            this.subjectSelect.appendChild(option);
        });
    },

    async handleCourseChange(event) {
        const courseId = event.target.value;
        if (courseId) {
            this.loadGroups(courseId);
        }
    },

    async loadGroups(courseId) {
        try {
            const response = await fetch(`/api/schedule/${courseId}`);
            if (response.ok) {
                const groups = await response.json();
                this.renderSchedule(groups);
            } else {
                throw new Error('Error loading groups.');
            }
        } catch (error) {
            console.error('Error loading groups:', error);
            alert('An error occurred while loading the groups.');
        }
    },

    renderSchedule(groups) {
        this.scheduleTableBody.innerHTML = '';
        const daysOfWeek = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const headerRow = document.querySelector('thead tr');
        while (headerRow.children.length > 2) {
            headerRow.removeChild(headerRow.lastChild);
        }

        groups.forEach(group => {
            const th = document.createElement('th');
            th.className = 'py-2 px-4 text-xs border';
            th.textContent = group.name;
            headerRow.appendChild(th);
        });

        daysOfWeek.forEach(day => {
            for (let i = 1; i <= 4; i++) {
                const row = document.createElement('tr');
                if (i === 1) {
                    const dayCell = document.createElement('td');
                    dayCell.className = 'py-3 px-6 border font-bold bg-gray-100';
                    dayCell.rowSpan = 4;
                    dayCell.textContent = day;
                    row.appendChild(dayCell);
                }

                const timeSlotCell = document.createElement('td');
                timeSlotCell.className = 'py-3 px-6 border';
                timeSlotCell.textContent = `${i}`;
                row.appendChild(timeSlotCell);

                groups.forEach(group => {
                    const groupCell = document.createElement('td');
                    groupCell.className = 'py-3 px-6 border cursor-pointer';
                    groupCell.addEventListener('click', () => this.openModal(groupCell, day, i, group.name));
                    row.appendChild(groupCell);
                });

                this.scheduleTableBody.appendChild(row);
            }
        });
    },

    openModal(cell, day, timeSlot, groupName) {
        this.selectedCell.value = `${day}-${timeSlot}-${groupName}`;
        const modalTitle = document.querySelector('#modal h2');
        modalTitle.textContent = `Dars Ma'lumotlarini Kiriting: ${day} ${timeSlot}-dars, Guruh: ${groupName}`;
        this.modal.classList.remove('hidden');
    },

    closeModal() {
        this.modal.classList.add('hidden');
    },

    saveData() {
        const room = document.getElementById('room').value;
        const teacher = document.getElementById('teacher').value;
        const subject = document.getElementById('subject').value;
        const group = document.getElementById('group').value;

        if (room && teacher && subject && group) {
            console.log('Saving data:', { room, teacher, subject, group });
            this.closeModal();
        } else {
            alert('Iltimos, barcha maydonlarni to\'ldiring.');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    GroupsManager.init();
});
