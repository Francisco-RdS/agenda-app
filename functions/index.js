// CÓDIGO DE BACKUP PARA functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicialização padrão e robusta
admin.initializeApp();

/**
 * Cria um novo usuário. Apenas gerentes podem chamar.
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== "gerente") {
    throw new functions.https.HttpsError("permission-denied", "Acesso negado. Apenas gerentes podem criar usuários.");
  }
  const {email, password, role} = data;
  if (!["atendente", "motorista", "gerente"].includes(role)) {
    throw new functions.https.HttpsError("invalid-argument", "Perfil inválido.");
  }
  try {
    const userRecord = await admin.auth().createUser({ email, password });
    await admin.auth().setCustomUserClaims(userRecord.uid, {role});
    return { message: `Usuário ${email} criado com sucesso.` };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Promove um usuário a gerente.
 */
exports.addGerenteRole = functions.https.onCall(async (data, context) => {
  // Segurança comentada para promover o primeiro gerente.
  /*
  if (!context.auth || context.auth.token.role !== "gerente") {
    throw new functions.https.HttpsError("permission-denied", "Acesso negado.");
  }
  */
  try {
    const user = await admin.auth().getUserByEmail(data.email);
    await admin.auth().setCustomUserClaims(user.uid, { role: "gerente" });
    return { message: `Sucesso! O usuário ${data.email} agora é um gerente.` };
  } catch (error) {
    console.error("Erro ao promover gerente:", error);
    if (error.code === 'auth/user-not-found') {
        throw new functions.https.HttpsError('not-found', `Email não encontrado.`);
    }
    throw new functions.https.HttpsError("internal", "Erro interno no servidor.");
  }
});