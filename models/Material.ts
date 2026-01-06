import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial extends Document {
    roomId: string;
    filename: string;
    contentType: string;
    data: Buffer;
    size: number;
    uploadedAt: Date;
}

const MaterialSchema: Schema = new Schema({
    roomId: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema);
