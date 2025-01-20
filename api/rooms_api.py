from fastapi import APIRouter, Depends, HTTPException, status
from DatabaseService import Room, get_db_core, DatabaseCore
from typing import List

router = APIRouter(
    prefix="/api",
    tags=["Rooms"],
    dependencies=[Depends(get_db_core)],
    responses={404: {"description": "Not found"}},
)


@router.get("/rooms/", response_model=List[Room])
async def read_rooms(db: DatabaseCore = Depends(get_db_core)):
    return await db.get(Room)


@router.post("/rooms/")
async def create_room(room: Room, db: DatabaseCore = Depends(get_db_core)):
    try:
        rooms = await db.add(room)
        if rooms:
            rooms.id = rooms
            return rooms
        raise HTTPException(status_code=500, detail="Teacher creation failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rooms/{room_id}", response_model=Room)
async def read_room(room_id: int, db: DatabaseCore = Depends(get_db_core)):
    try:
        room = await db.get(Room, {"id": room_id})
        if room:
            return room
        raise HTTPException(status_code=404, detail="Room not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/teachers/{id}")
async def delete_teacher(id: int, db: DatabaseCore = Depends(get_db_core)):
    try:
        deleted_count = await db.delete(Room, {"id": id})
        if deleted_count:
            return {"message": "Room deleted successfully"}
        raise HTTPException(status_code=404, detail="Room not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
