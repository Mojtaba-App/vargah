-- CreateTable
CREATE TABLE "role_permission_configs" (
    "role" "UserRole" NOT NULL,
    "permissions" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "role_permission_configs_pkey" PRIMARY KEY ("role")
);

-- AddForeignKey
ALTER TABLE "role_permission_configs" ADD CONSTRAINT "role_permission_configs_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
