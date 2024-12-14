const GroupsManager = {
    init() {
        this.groupsTable = document.getElementById('groups-table');
        this.addGroupForm = document.getElementById('add-group-form');
        this.bindEvents();
        this.loadCourses();
        this.loadGroups();
    },

    bindEvents() {
        this.addGroupForm.addEventListener('submit', this.handleAddGroup.bind(this));
    },

    async loadCourses() {
        try {
            const response = await fetch('/api/courses/for/groups');
            if (response.ok) {
                const courses = await response.json();
                this.populateCoursesDropdown(courses);
            } else {
                throw new Error('Kurslarni yuklashda xatolik.');
            }
        } catch (error) {
            console.error('Kurslarni yuklashda xatolik:', error);
            alert('Kurslarni yuklashda xatolik yuz berdi.');
        }
    },

    populateCoursesDropdown(courses) {
        const courseSelector = document.getElementById('courseSelector');
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            courseSelector.appendChild(option);
        });
    },

    async loadGroups() {
        try {
            const response = await fetch('/api/groups/');
            if (response.ok) {
                const groups = await response.json();
                this.renderGroups(groups);
            } else {
                throw new Error('Guruhlarni yuklashda xatolik.');
            }
        } catch (error) {
            console.error('Guruhlarni yuklashda xatolik:', error);
            alert('Guruhlarni yuklashda xatolik yuz berdi.');
        }
    },

    renderGroups(groups) {
        const tbody = this.groupsTable.querySelector('tbody');
        tbody.innerHTML = '';
        groups.forEach(group => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${group.name}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${group.course_id || 'Noma\'lum'}</td>
            `;
            tbody.appendChild(row);
        });
    },

    async handleAddGroup(e) {
        e.preventDefault();
        const formData = new FormData(this.addGroupForm);
        const groupData = {
            name: formData.get('name'),
            course_id: formData.get('courseSelector')
        };

        try {
            const response = await fetch('/api/groups/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupData),
            });

            if (response.ok) {
                const newGroup = await response.json();
                this.loadGroups(); // O'zgarishni yuklash
                this.addGroupForm.reset();
                alert('Guruh muvaffaqiyatli qo\'shildi.');
            } else {
                throw new Error('Guruhni qo\'shishda xatolik yuz berdi.');
            }
        } catch (error) {
            console.error('Error adding group:', error);
            alert(error.message);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    GroupsManager.init();
});
