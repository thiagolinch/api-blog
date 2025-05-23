import { inject, injectable } from "tsyringe";
import { hash } from "bcryptjs"

import { Admins } from "../../entity/Admins";

import { IAdminsRepository, IAdminsRepositoryDTO } from "../../repositories/IAdminsRepository";
import { IAdminRoleRepository } from "../../repositories/IAdminRole";

@injectable()
class CreateAdmUseCase {
    constructor(
        @inject("AdminRepository")
        private adminRepository: IAdminsRepository,
        @inject("AdminRoleRepository")
        private roleRepo: IAdminRoleRepository
    ) {}
    async execute({
        name,
        email,
        role,
        password,
        cellphone
    }: IAdminsRepositoryDTO): Promise<Admins> {
        const adminExists = await this.adminRepository.findByEmail(email)

        if(adminExists) {
            throw new Error("This admin account already exists!").message
        }
        
        let userRole = role

        if(!role) {
            userRole = 'membro'
        }

        const passwordCrypt = await hash(password, 8)

        const admin = await this.adminRepository.create({
            name,
            email,
            password: passwordCrypt,
            cellphone,
            role: userRole,
        })

        return admin
    }
}

export { CreateAdmUseCase }