import mongoose, { Schema, Document } from 'mongoose';

export interface IWhiteboardLog extends Document {
    roomId: string;
    userId: string;
    type: string;
    data: Record<string, unknown>;
    timestamp: Date;
}

const WhiteboardLogSchema = new Schema<IWhiteboardLog>({
    roomId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.WhiteboardLog || mongoose.model<IWhiteboardLog>('WhiteboardLog', WhiteboardLogSchema);
