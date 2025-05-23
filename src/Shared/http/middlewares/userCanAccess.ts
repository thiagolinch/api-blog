import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { AdminRepository } from "../../../Modules/Admins/repositories/implements/AdminsRepository";
import { ArticleRepository } from "../../../Modules/Posts/repository/implements/ArticlesRepository";

interface IPayload {
    subject: string;
    role: string;
    access: string;
}

async function userCanAccess(request: Request, response: Response, next: NextFunction) {
    const authHeader = request.headers.authorization || undefined;
    const postId = request.params;
    let auth = null;

    try {
        const postRepo = new ArticleRepository()
        const post = await postRepo.findById(postId.id)

        if (!post) {
            return response.status(404).json({ message: "Post não encontrado" });
        }

        if(post.visibility === "publico") {
            request.post = false
            next();
        }

        if(!authHeader) {
            return response.status(403).json({ message: "Para acessar o post precisa de login" });
        };
        
        const [, token] = authHeader.split(" ");
        const { subject: admin_id } = verify(token, "88f1c14bd2a14b42fad21d64739889e9") as IPayload;

        const adminRepo = new AdminRepository();
        const admin = await adminRepo.findById(admin_id);

        if(post.visibility === "membro" && !authHeader) {
            request.post = true
            next();
        }

        // Define se o usuário tem acesso completo
        const hasFullAccess =
            admin.role === "administrador" ||
            admin.role === "editor" ||
            admin.role === "colaborador" ||
            admin.role === "autor" ||
            (post.visibility === "public") ||
            (post.visibility === admin.role && admin.payment_id !== null) // melhorar a parte de verificar o pagamento
        ;

        // Formata o post com base no nível de acesso
        request.post = hasFullAccess
            ? false // Retorna o post completo
            : true // Retorna o post formatado
        ;

        next();
    } catch (error) {
        console.error("Erro no middleware de autenticação:", error);

        if (error instanceof Error && error.name === "JsonWebTokenError") {
            return response.status(401).json({ message: error.message });
        }

        return response.status(500).json({ message: error.message });
    }
}

export { userCanAccess };
