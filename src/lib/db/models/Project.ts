import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProject extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    owner: Types.ObjectId;
    members: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            minlength: [2, "Project name must be at least 2 characters"],
            maxlength: [100, "Project name must be less than 100 characters"],
        },
        description: {
            type: String,
            default: "",
            maxlength: [500, "Description must be less than 500 characters"],
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Owner is required"],
        },
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for faster owner lookups
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ members: 1 });

const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
