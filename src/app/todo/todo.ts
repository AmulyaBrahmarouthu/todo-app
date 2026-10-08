import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { SupabaseService, Todo } from '../supabase.service';

type TodoFilter = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-todo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo.html',
  styleUrl: './todo.css',
})
export class TodoComponent implements OnInit {
  private readonly supabaseService = inject(SupabaseService);

  protected readonly todos = signal<Todo[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly newTodoText = signal('');
  protected readonly isAdding = signal(false);
  protected readonly addErrorMessage = signal<string | null>(null);
  protected readonly editingTodoId = signal<Todo['id'] | null>(null);
  protected readonly editingText = signal('');
  protected readonly isSavingEdit = signal(false);
  protected readonly isDeletingTodoId = signal<Todo['id'] | null>(null);
  protected readonly actionErrorMessage = signal<string | null>(null);
  protected readonly filter = signal<TodoFilter>('all');

  protected readonly visibleTodos = computed(() => {
    const selectedFilter = this.filter();

    return this.todos().filter((todo) => {
      if (selectedFilter === 'active') {
        return !todo.completed;
      }

      if (selectedFilter === 'completed') {
        return todo.completed;
      }

      return true;
    });
  });

  protected readonly remainingCount = computed(
    () => this.todos().filter((todo) => !todo.completed).length,
  );

  ngOnInit(): void {
    void this.loadTodos();
  }

  protected async loadTodos(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      this.todos.set(await this.supabaseService.getTodos());
    } catch (error: unknown) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'An unexpected error occurred while loading todos.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected updateNewTodoText(event: Event): void {
    this.newTodoText.set((event.target as HTMLInputElement).value);
    this.addErrorMessage.set(null);
  }

  protected async addTodo(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const name = this.newTodoText().trim();

    if (!name || this.isAdding()) {
      return;
    }

    this.isAdding.set(true);
    this.addErrorMessage.set(null);

    try {
      await this.supabaseService.addTodo(name);
      this.newTodoText.set('');
      await this.loadTodos();
    } catch (error: unknown) {
      this.addErrorMessage.set(
        error instanceof Error ? error.message : 'An unexpected error occurred while adding the todo.',
      );
    } finally {
      this.isAdding.set(false);
    }
  }

  protected startEdit(todo: Todo): void {
    this.actionErrorMessage.set(null);
    this.editingTodoId.set(todo.id);
    this.editingText.set(todo.title);
  }

  protected updateEditingText(event: Event): void {
    this.editingText.set((event.target as HTMLInputElement).value);
    this.actionErrorMessage.set(null);
  }

  protected cancelEdit(): void {
    this.editingTodoId.set(null);
    this.editingText.set('');
    this.actionErrorMessage.set(null);
  }

  protected async saveEdit(event: SubmitEvent, todoId: Todo['id']): Promise<void> {
    event.preventDefault();
    const name = this.editingText().trim();

    if (!name || this.isSavingEdit()) {
      return;
    }

    this.isSavingEdit.set(true);
    this.actionErrorMessage.set(null);

    try {
      await this.supabaseService.updateTodo(todoId, name);
      this.editingTodoId.set(null);
      this.editingText.set('');
      await this.loadTodos();
    } catch (error: unknown) {
      this.actionErrorMessage.set(
        error instanceof Error ? error.message : 'An unexpected error occurred while updating the todo.',
      );
    } finally {
      this.isSavingEdit.set(false);
    }
  }

  protected async deleteTodo(todoId: Todo['id']): Promise<void> {
    if (this.isDeletingTodoId() !== null) {
      return;
    }

    this.isDeletingTodoId.set(todoId);
    this.actionErrorMessage.set(null);

    try {
      await this.supabaseService.deleteTodo(todoId);
      await this.loadTodos();
    } catch (error: unknown) {
      this.actionErrorMessage.set(
        error instanceof Error ? error.message : 'An unexpected error occurred while deleting the todo.',
      );
    } finally {
      this.isDeletingTodoId.set(null);
    }
  }

  protected setFilter(filter: TodoFilter): void {
    this.filter.set(filter);
  }
}
