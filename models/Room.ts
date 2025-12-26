import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    code: string;
    hostId: string;
    active: boolean;
    createdAt: Date;
}

const RoomSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    hostId: { type: String, required: true },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now, expires: '24h' },
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
