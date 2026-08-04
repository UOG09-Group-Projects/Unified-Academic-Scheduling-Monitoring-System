import random
import string

from django.db import migrations


def _generate_code(existing_codes):
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(alphabet, k=8))
        if code not in existing_codes:
            return code


def backfill_join_codes(apps, schema_editor):
    Institution = apps.get_model('institutions', 'Institution')
    existing_codes = set(
        Institution.objects.exclude(join_code=None).values_list('join_code', flat=True)
    )
    for institution in Institution.objects.filter(join_code=None):
        code = _generate_code(existing_codes)
        existing_codes.add(code)
        institution.join_code = code
        institution.save(update_fields=['join_code'])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0013_student_auth_fields'),
    ]

    operations = [
        migrations.RunPython(backfill_join_codes, noop),
    ]
