export function isStrongPassword(password) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[#\$%&*@]).{8,}$/.test(password);
}