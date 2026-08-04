from django.db import migrations, models


def forwards(apps, schema_editor):
    Progress = apps.get_model('institutions', 'Progress')
    Progress.objects.filter(completed=True).update(status='completed', status_updated_at=models.F('completed_at'))


def backwards(apps, schema_editor):
    Progress = apps.get_model('institutions', 'Progress')
    Progress.objects.filter(status='completed').update(completed=True, completed_at=models.F('status_updated_at'))


class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0011_duesoonreminder'),
    ]

    operations = [
        migrations.AddField(
            model_name='progress',
            name='status',
            field=models.CharField(
                choices=[('not_started', 'Not started'), ('in_progress', 'In progress'), ('completed', 'Completed')],
                default='not_started',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='progress',
            name='status_updated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.RemoveField(
            model_name='progress',
            name='completed',
        ),
        migrations.RemoveField(
            model_name='progress',
            name='completed_at',
        ),
    ]
