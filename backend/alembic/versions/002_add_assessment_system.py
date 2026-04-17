"""
Alembic migration script for Assessment System

This migration adds the new tables for the assessment system:
- assessment_questions
- assessment_answers

And modifies the assessments table structure.

Run with: alembic upgrade head
"""

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    """Create new assessment tables and update existing ones"""
    
    # Drop the old questions and answers JSON columns from assessments if they exist
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    columns = [c['name'] for c in inspector.get_columns('assessments')]
    
    # Remove old JSON columns if they exist
    if 'questions' in columns:
        op.drop_column('assessments', 'questions')
    if 'answers' in columns:
        op.drop_column('assessments', 'answers')
    
    # Make application_id unique if not already
    try:
        op.create_unique_constraint('uq_assessments_application_id', 'assessments', ['application_id'])
    except:
        pass  # Constraint might already exist

    # Create assessment_questions table
    op.create_table(
        'assessment_questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('option_a', sa.String(), nullable=False),
        sa.Column('option_b', sa.String(), nullable=False),
        sa.Column('option_c', sa.String(), nullable=False),
        sa.Column('option_d', sa.String(), nullable=False),
        sa.Column('correct_option', sa.String(), nullable=False),
        sa.Column('topic', sa.String(), nullable=True),
        sa.Column('difficulty', sa.String(), nullable=True),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessment_questions_assessment_id'), 'assessment_questions', ['assessment_id'])

    # Create assessment_answers table
    op.create_table(
        'assessment_answers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('assessment_id', sa.Integer(), nullable=False),
        sa.Column('question_id', sa.Integer(), nullable=False),
        sa.Column('selected_option', sa.String(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['assessment_id'], ['assessments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['assessment_questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessment_answers_assessment_id'), 'assessment_answers', ['assessment_id'])
    op.create_index(op.f('ix_assessment_answers_question_id'), 'assessment_answers', ['question_id'])


def downgrade() -> None:
    """Rollback: Remove assessment tables and restore old structure"""
    
    # Drop indexes
    op.drop_index(op.f('ix_assessment_answers_question_id'), table_name='assessment_answers')
    op.drop_index(op.f('ix_assessment_answers_assessment_id'), table_name='assessment_answers')
    op.drop_table('assessment_answers')
    
    op.drop_index(op.f('ix_assessment_questions_assessment_id'), table_name='assessment_questions')
    op.drop_table('assessment_questions')
    
    # Restore old JSON columns
    op.add_column('assessments', sa.Column('questions', sa.JSON(), nullable=False))
    op.add_column('assessments', sa.Column('answers', sa.JSON(), nullable=True))
