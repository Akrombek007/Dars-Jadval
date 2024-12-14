const SubjectsManager = {
    init() {
        this.subjectsTable = document.getElementById('subjects-table');
        this.addSubjectForm = document.getElementById('add-subject-form');
        this.bindEvents();
        this.loadCourses();
        this.loadSubjects();
    },

    bindEvents() {
        this.addSubjectForm.addEventListener('submit', this.handleAddSubject.bind(this));
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
        courseSelector.innerHTML = '<option value="">Kursni tanlang</option>';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = course.name;
            option.dataset.courseName = course.name; // Kurs nomini dataset orqali saqlaymiz
            courseSelector.appendChild(option);
        });
    },

    async loadSubjects() {
        try {
            const response = await fetch('/api/subjects/');
            if (response.ok) {
                const subjects = await response.json();
                this.renderSubjects(subjects);
            } else {
                throw new Error('Fanlarni yuklashda xatolik.');
            }
        } catch (error) {
            console.error('Fanlarni yuklashda xatolik:', error);
            alert('Fanlarni yuklashda xatolik yuz berdi.');
        }
    },

    renderSubjects(subjects) {
        const tbody = this.subjectsTable.querySelector('tbody');
        tbody.innerHTML = '';
        subjects.forEach(subject => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${subject.name}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${subject.subject_type}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${subject.course_name || 'Noma\'lum'}</td>
                <td class="px-6 py-4 text-sm">
                    <button onclick="SubjectsManager.deleteSubject(${subject.id})" class="bg-red-500 text-white px-2 py-1 rounded">O'chirish</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    async handleAddSubject(e) {
        e.preventDefault();
        const formData = new FormData(this.addSubjectForm);
        const courseSelector = document.getElementById('courseSelector');
        const selectedOption = courseSelector.options[courseSelector.selectedIndex];

        // Tanlangan kursning nomini olish (dataset orqali)
        const courseName = selectedOption.dataset.courseName;

        const subjectData = {
            name: formData.get('name'),
            subject_type: formData.get('subject_type'),
            course_id: formData.get('courseSelector'),
            course_name: courseName, // Tanlangan kurs nomi qo'shiladi
        };

        try {
            const response = await fetch('/api/subjects/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subjectData),
            });

            if (response.ok) {
                this.loadSubjects(); // Reload subjects after addition
                this.addSubjectForm.reset();
                alert('Fan muvaffaqiyatli qo\'shildi.');
            } else {
                throw new Error('Fan qo\'shishda xatolik yuz berdi.');
            }
        } catch (error) {
            console.error('Fan qo\'shishda xatolik:', error);
            alert(error.message);
        }
    },

    async deleteSubject(id) {
        if (confirm('Haqiqatan ham bu fanni o\'chirmoqchimisiz?')) {
            try {
                const response = await fetch(`/api/subjects/${id}`, {method: 'DELETE'});
                console.log(response);
                if (response.ok) {
                    this.loadSubjects(); // Reload subjects after deletion
                    alert('Fan muvaffaqiyatli o\'chirildi.');
                } else {
                    throw new Error('Fan o\'chirishda xatolik yuz berdi.');
                }
            } catch (error) {
                console.error('Fan o\'chirishda xatolik:', error);
                alert(error.message);
            }
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    SubjectsManager.init();
});
