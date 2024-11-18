// models/VerificationToken.js
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VerificationToken = sequelize.define(
  "verification_token",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiryTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    timestamps: false, // Disable default timestamps
    tableName: "verification_tokens", // Explicitly set table name
  }
);

export default VerificationToken;
