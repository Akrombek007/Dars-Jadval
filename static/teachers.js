const TeachersManager = {
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadTeachers();
    },

    cacheElements() {
        this.teachersTable = document.getElementById('teachers-table');
        this.addTeacherForm = document.getElementById('add-teacher-form');
    },

    bindEvents() {
        this.addTeacherForm.addEventListener('submit', event => {
            event.preventDefault();
            this.addTeacher();
        });
    },

    loadTeachers() {
        fetch('/api/teachers/')
            .then(response => response.json())
            .then(teachers => {
                this.teachersTable.tBodies[0].innerHTML = '';
                teachers.forEach(teacher => {
                    const row = this.teachersTable.tBodies[0].insertRow();
                    row.insertCell().textContent = teacher.name;
                    row.insertCell().textContent = teacher.sciencename;
                    row.insertCell().textContent = teacher.classtime;
                    const actionsCell = row.insertCell();
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'O\'chirish';
                    deleteButton.classList.add('bg-red-500', 'text-white', 'px-2', 'py-1', 'rounded');
                    deleteButton.onclick = () => this.deleteTeacher(teacher.id);
                    actionsCell.appendChild(deleteButton);
                });
            })
            .catch(error => console.error('Error loading teachers:', error));
    },

    addTeacher() {
        const nameInput = document.getElementById('teacher-name');
        const sciencenameInput = document.getElementById('teacher-sciencename');
        const classtimeInput = document.getElementById('teacher-classtime');

        const name = nameInput.value;
        const sciencename = sciencenameInput.value;
        const classtime = classtimeInput.value;

        fetch('/api/teachers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                sciencename,
                classtime
            })
        })
            .then(response => response.json())
            .then(() => {
                this.loadTeachers();
                nameInput.value = '';
                sciencenameInput.value = '';
                classtimeInput.value = '';
            })
            .catch(error => console.error('Error adding teacher:', error));
    },

    deleteTeacher(id) {
        if (confirm('Haqiqatan ham ushbu o\'qituvchini o\'chirmoqchimisiz?')) {
            fetch(`/api/teachers/${id}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (response.ok) {
                        this.loadTeachers(); // O'qituvchi o'chirilgandan so'ng, ro'yxatni yangilash
                    } else {
                        alert('O\'qituvchi o\'chirilishi mumkin emas.');
                    }
                })
                .catch(error => console.error('Error deleting teacher:', error));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TeachersManager.init();
});
