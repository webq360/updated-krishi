import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDataDocument extends Document {
  collectionName: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const DataDocumentSchema = new Schema<IDataDocument>(
  {
    collectionName: {
      type: String,
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

DataDocumentSchema.index({ collectionName: 1, createdAt: -1 });

const DataDocument: Model<IDataDocument> = (mongoose.models.DataDocument as Model<IDataDocument>) || mongoose.model<IDataDocument>('DataDocument', DataDocumentSchema);

export default DataDocument;

