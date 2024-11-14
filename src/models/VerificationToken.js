// models/VerificationToken.js
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class VerificationToken extends Model {}

VerificationToken.init(
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "VerificationToken",
    tableName: "email_verification_tokens",
    timestamps: false,
  }
);

export default VerificationToken;
