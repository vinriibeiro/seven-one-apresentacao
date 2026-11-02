"use strict";
const redef = /^#\/redefinir\/([A-Za-z0-9_-]{20,})$/.exec(location.hash || "");
if (redef) S.telaRedefinir(redef[1]);
else S.sessao ? (S.sessao.usuario.trocar ? S.telaTrocarSenha(true) : S.iniciar()) : S.telaLogin();
