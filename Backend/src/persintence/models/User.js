import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export  const User = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    admin : {
      type: DataTypes.BOOLEAN,
    },
    name: {
      type: DataTypes.STRING,
    },
    mail: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provider: {
      type: DataTypes.STRING
    },
    providerid: {
      type: DataTypes.STRING
    }
  },
  {
    timestamps: false,
  }
);

