const RoomsManager = {
    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadRooms();
    },

    cacheElements() {
        this.roomsTable = document.getElementById('rooms-table');
        this.addRoomForm = document.getElementById('add-room-form');
    },

    bindEvents() {
        this.addRoomForm.addEventListener('submit', event => {
            event.preventDefault();
            this.addRoom();
        });
    },

    loadRooms() {
        fetch('/api/rooms/')
            .then(response => response.json())
            .then(rooms => {
                this.roomsTable.tBodies[0].innerHTML = ''; // Jadvalni tozalash
                rooms.forEach(room => {
                    const row = this.roomsTable.tBodies[0].insertRow();
                    row.insertCell().textContent = room.name;
                    row.insertCell().textContent = room.roomstype;

                    // Amallar bo'limi
                    const actionsCell = row.insertCell();
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'O\'chirish';
                    deleteButton.classList.add('bg-red-500', 'text-white', 'px-2', 'py-1', 'rounded');
                    deleteButton.onclick = () => this.deleteRoom(room.id); // Delete functionality
                    actionsCell.appendChild(deleteButton);
                });
            })
            .catch(error => console.error('Error loading rooms:', error));
    },

    addRoom() {
        const nameInput = document.getElementById('room-name');
        const roomTypeInput = document.getElementById('room-type');

        const name = nameInput.value;
        const roomstype = roomTypeInput.value;

        fetch('/api/rooms/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                roomstype
            })
        })
        .then(response => response.json())
        .then(() => {
            this.loadRooms();
            nameInput.value = '';
            roomTypeInput.value = '';
        })
        .catch(error => console.error('Error adding room:', error));
    },

    deleteRoom(id) {
        if (confirm('Haqiqatan ham ushbu xonani o\'chirmoqchimisiz?')) {
            fetch(`/api/rooms/${id}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (response.ok) {
                    this.loadRooms(); // Xona o'chirilgandan so'ng, ro'yxatni yangilash
                } else {
                    alert('Xona o\'chirilishi mumkin emas.');
                }
            })
            .catch(error => console.error('Error deleting room:', error));
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    RoomsManager.init();
});
