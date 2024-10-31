import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { v4 as uuidv4 } from "uuid";

const Image = sequelize.define(
  "ProfilePicture",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
      readOnly: true,
      example: "image.jpg",
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
      readOnly: true,
      example: "bucket-name/user-id/image-file.extension",
    },
    upload_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
      readOnly: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      readOnly: true,
      example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    },
  },
  {
    timestamps: false,
    tableName: "Image",
  }
);

export default Image;
