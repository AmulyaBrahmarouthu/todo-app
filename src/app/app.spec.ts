import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { App } from './app';
import { SupabaseService, Todo } from './supabase.service';

describe('App', () => {
  const sampleTodos: Todo[] = [
    { id: 1, title: 'Plan the day', completed: false },
    { id: 2, title: 'Take a short walk', completed: true },
    { id: 3, title: 'Read for 20 minutes', completed: false },
  ];
  const getTodos = vi.fn<() => Promise<Todo[]>>();
  const addTodo = vi.fn<(name: string) => Promise<void>>();
  const updateTodo = vi.fn<(id: Todo['id'], name: string) => Promise<void>>();
  const deleteTodo = vi.fn<(id: Todo['id']) => Promise<void>>();

  beforeEach(async () => {
    getTodos.mockReset();
    getTodos.mockResolvedValue(sampleTodos);
    addTodo.mockReset();
    addTodo.mockResolvedValue();
    updateTodo.mockReset();
    updateTodo.mockResolvedValue();
    deleteTodo.mockReset();
    deleteTodo.mockResolvedValue();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: SupabaseService, useValue: { getTodos, addTodo, updateTodo, deleteTodo } }],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should show todos returned by Supabase', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('My todos');
    expect(compiled.querySelectorAll('.todo-item').length).toBe(3);
    expect(compiled.textContent).toContain('Plan the day');
  });

  it('should show an empty-list message when Supabase returns no todos', async () => {
    getTodos.mockResolvedValueOnce([]);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('.todo-item').length).toBe(0);
    expect(compiled.textContent).toContain('No todos yet.');
  });

  it('should show a loading message while todos are loading', () => {
    getTodos.mockReturnValue(new Promise(() => {}));
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Loading todos...',
    );
  });

  it('should display a Supabase error and offer a retry', async () => {
    getTodos.mockRejectedValue(new Error('Could not load todos: permission denied'));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('permission denied');
    expect(compiled.textContent).toContain('Try again');
  });

  it('should add a todo through Supabase and refresh the list', async () => {
    getTodos
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        ...sampleTodos,
        { id: 4, title: 'Water the plants', completed: false },
      ]);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#new-todo') as HTMLInputElement;
    input.value = '  Water the plants  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.add-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(addTodo).toHaveBeenCalledWith('Water the plants');
    expect(getTodos).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Water the plants');
  });

  it('should not submit an empty todo', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.add-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(addTodo).not.toHaveBeenCalled();
  });

  it('should show an error when Supabase cannot add the todo', async () => {
    getTodos.mockResolvedValueOnce([]);
    addTodo.mockRejectedValueOnce(new Error('Could not add todo: permission denied'));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#new-todo') as HTMLInputElement;
    input.value = 'Water the plants';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const form = fixture.nativeElement.querySelector('.add-form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'permission denied',
    );
  });

  it('should update a todo in Supabase and reload the list', async () => {
    getTodos
      .mockResolvedValueOnce(sampleTodos)
      .mockResolvedValueOnce([
        { ...sampleTodos[0], title: 'Plan the week' },
        ...sampleTodos.slice(1),
      ]);
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector('[aria-label="Edit Plan the day"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#edit-todo-1') as HTMLInputElement;
    input.value = '  Plan the week  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const editForm = fixture.nativeElement.querySelector('.edit-form') as HTMLFormElement;
    editForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(updateTodo).toHaveBeenCalledWith(1, 'Plan the week');
    expect(getTodos).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Plan the week');
  });

  it('should not update a todo with an empty name', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const editButton = fixture.nativeElement.querySelector('[aria-label="Edit Plan the day"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#edit-todo-1') as HTMLInputElement;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const editForm = fixture.nativeElement.querySelector('.edit-form') as HTMLFormElement;
    editForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    expect(updateTodo).not.toHaveBeenCalled();
  });

  it('should show an error when Supabase cannot update a todo', async () => {
    updateTodo.mockRejectedValueOnce(new Error('Could not update todo: permission denied'));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const editButton = fixture.nativeElement.querySelector('[aria-label="Edit Plan the day"]') as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();
    const editForm = fixture.nativeElement.querySelector('.edit-form') as HTMLFormElement;
    editForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'permission denied',
    );
  });

  it('should delete a todo in Supabase and reload the list', async () => {
    getTodos
      .mockResolvedValueOnce(sampleTodos)
      .mockResolvedValueOnce(sampleTodos.slice(1));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      '[aria-label="Delete Plan the day"]',
    ) as HTMLButtonElement;
    deleteButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(deleteTodo).toHaveBeenCalledWith(1);
    expect(getTodos).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).not.toContain('Plan the day');
  });

  it('should show an error when Supabase cannot delete a todo', async () => {
    deleteTodo.mockRejectedValueOnce(new Error('Could not delete todo: permission denied'));
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();
    const deleteButton = fixture.nativeElement.querySelector(
      '[aria-label="Delete Plan the day"]',
    ) as HTMLButtonElement;
    deleteButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'permission denied',
    );
  });
});
