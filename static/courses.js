const CoursesManager = {
    init() {
        this.coursesTable = document.getElementById('courses-table');
        this.addCourseForm = document.getElementById('add-course-form');
        this.bindEvents();
        this.loadCourses();
    },

    bindEvents() {
        this.addCourseForm.addEventListener('submit', this.handleAddCourse.bind(this));
    },

    async loadCourses() {
        try {
            const response = await fetch('/api/courses/');
            if (response.ok) {
                const courses = await response.json();
                console.log('Courses loaded:', courses);
                courses.forEach(course => {
                    this.addCourseToTable(course);
                });
            } else {
                throw new Error('Courses could not be loaded.');
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            alert('Kurslarni yuklashda xatolik yuz berdi.');
        }
    },

    async handleAddCourse(e) {
        e.preventDefault();
        const formData = new FormData(this.addCourseForm);
        const courseData = {
            name: formData.get('name'),
            description: formData.get('description')
        };
        try {
            const response = await fetch('/api/courses/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(courseData),
            });

            if (response.ok) {
                const newCourse = await response.json();
                this.addCourseToTable(newCourse);
                this.addCourseForm.reset();
                alert('Kurs muvaffaqiyatli qo\'shildi.');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Kursni qo\'shishda xatolik yuz berdi.');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            alert(error.message);
        }
    },

    addCourseToTable(course) {
        const tbody = this.coursesTable.querySelector('tbody');
        const row = document.createElement('tr');
        row.classList.add('border-b');
        row.dataset.id = course.id;
        row.innerHTML = `
            <td class="p-2">${course.name}</td>
            <td class="p-2">${course.description || ''}</td>
            <td class="p-2">
                <button onclick="CoursesManager.editCourse(${course.id})" class="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Tahrirlash</button>
                <button onclick="CoursesManager.deleteCourse(${course.id})" class="bg-red-500 text-white px-2 py-1 rounded">O'chirish</button>
            </td>
        `;
        tbody.appendChild(row);
    },

    editCourse(courseId) {
        // TODO: implement course editing functionality
        console.log(`Edit course with id ${courseId}`);
    },

    deleteCourse(courseId) {
        // TODO: implement course deleting functionality
        console.log(`Delete course with id ${courseId}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CoursesManager.init();
});