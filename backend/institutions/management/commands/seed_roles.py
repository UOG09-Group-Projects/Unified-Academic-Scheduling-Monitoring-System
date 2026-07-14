"""
management/commands/seed_roles.py

Idempotent seed: safe to re-run at any time.
Creates:
  - Module rows  (one per module group)
  - Permission rows  (each FK'd to its module)
  - Default Role rows  (no permissions assigned — done via the UI)

After seeding, prints a verification table so you can confirm every row
landed correctly in the database.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from institutions.models import Module, Permission, Role


SEED_DATA = {
    "Institution Management": [
        "view_institution", "edit_institution",
    ],
    "Batch Management": [
        "view_batch", "create_batch", "edit_batch", "delete_batch",
    ],
    "Course Management": [
        "view_course", "create_course", "edit_course", "delete_course",
        "assign_educator", "transfer_batch",
    ],
    "Student Management": [
        "view_student", "create_student", "edit_student", "delete_student",
        "view_guardian", "manage_guardian",
    ],
    "Educator Management": [
        "view_educator", "create_educator", "edit_educator", "delete_educator",
    ],
    "Manager Management": [
        "view_manager", "create_manager", "edit_manager", "delete_manager",
    ],
    "Enrollment Management": [
        "view_enrollment", "create_enrollment", "delete_enrollment",
    ],
    "Activity Management": [
        "view_activity", "create_activity", "edit_activity", "delete_activity",
    ],
    "Progress Management": [
        "view_progress", "edit_progress",
    ],
    "Authorization Management": [
        "view_role", "create_role", "edit_role", "delete_role",
        "assign_permission",
    ],
}

DEFAULT_ROLES = [
    "owner", "admin", "manager", "educator", "student", "parent",
]


class Command(BaseCommand):
    help = "Seed modules, permissions, and default roles"

    def handle(self, *args, **kwargs):
        self.stdout.write("\n── Seeding modules & permissions ──────────────────")

        modules_created   = 0
        perms_created     = 0
        perms_updated     = 0   # already existed but module FK was wrong

        with transaction.atomic():

            # ── 1. Modules + Permissions ─────────────────────────────────────
            for module_name, perm_names in SEED_DATA.items():

                module, m_created = Module.objects.get_or_create(name=module_name)
                if m_created:
                    modules_created += 1
                    self.stdout.write(f"  [+] Module  : {module_name}")
                else:
                    self.stdout.write(f"  [=] Module  : {module_name} (exists, id={module.id})")

                for perm_name in perm_names:
                    perm, p_created = Permission.objects.get_or_create(
                        name=perm_name,
                        defaults={"modules_id": module.id},
                    )

                    if p_created:
                        perms_created += 1
                        self.stdout.write(f"      [+] Permission: {perm_name}")
                    else:
                        # If the permission already exists but points to the wrong
                        # module (e.g. from a partial old seed), fix it.
                        if perm.modules_id != module.id:
                            perm.modules_id = module.id
                            perm.save(update_fields=["modules_id"])
                            perms_updated += 1
                            self.stdout.write(
                                f"      [~] Permission: {perm_name} "
                                f"(re-linked to {module_name})"
                            )
                        else:
                            self.stdout.write(f"      [=] Permission: {perm_name} (exists)")

            # ── 2. Default Roles ─────────────────────────────────────────────
            self.stdout.write("\n── Seeding default roles ──────────────────────────")
            roles_created = 0
            for role_name in DEFAULT_ROLES:
                role, r_created = Role.objects.get_or_create(name=role_name)
                if r_created:
                    roles_created += 1
                    self.stdout.write(f"  [+] Role: {role_name}")
                else:
                    self.stdout.write(f"  [=] Role: {role_name} (exists, id={role.id})")

        # ── 3. Verification summary ──────────────────────────────────────────
        self.stdout.write("\n── Verification ───────────────────────────────────")
        self.stdout.write(
            f"  {'Module':<30} {'id':>4}  {'Permissions':>12}"
        )
        self.stdout.write("  " + "-" * 52)

        total_perms_in_db = 0
        for module_name in SEED_DATA:
            try:
                module = Module.objects.get(name=module_name)
                perm_count = Permission.objects.filter(modules_id=module.id).count()
                total_perms_in_db += perm_count
                self.stdout.write(
                    f"  {module_name:<30} {module.id:>4}  {perm_count:>12}"
                )
            except Module.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"  {module_name:<30} MISSING!")
                )

        self.stdout.write("  " + "-" * 52)
        self.stdout.write(
            f"  {'TOTAL':<30} {'':>4}  {total_perms_in_db:>12}"
        )

        role_count = Role.objects.filter(name__in=DEFAULT_ROLES).count()
        self.stdout.write(f"\n  Default roles in DB : {role_count}/{len(DEFAULT_ROLES)}")

        # ── 4. Final status ──────────────────────────────────────────────────
        self.stdout.write("")
        if modules_created or perms_created or perms_updated or roles_created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Done. Created {modules_created} module(s), "
                    f"{perms_created} permission(s) "
                    f"(+{perms_updated} re-linked), "
                    f"{roles_created} role(s)."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Done. Everything was already up to date.")
            )