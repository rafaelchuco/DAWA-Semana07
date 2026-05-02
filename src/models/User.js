import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true
    },
    birthdate: {
        type: Date,
        required: true
    },
    url_profile: {
        type: String,
        trim: true,
        default: ''
    },
    adress: {
        type: String,
        trim: true,
        default: ''
    },
    password: { 
        type: String,
        required: true,
        minlength: 8,
        validate: {
            validator: function(password) {
                return /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&*@]).{8,}$/.test(password);
            },
            message: 'La contraseña debe tener al menos 8 caracteres, 1 mayúscula, 1 dígito y 1 caracter especial (# $ % & * @)'
        }
    },
    roles: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Role' 
    }],
}, { timestamps: true });

export default mongoose.model('User', UserSchema);