import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../environments/environment';

interface TodoRow {
  id: number | string;
  created_at: string;
  name: string;
  is_completed: boolean;
}

export interface Todo {
  id: number | string;
  title: string;
  completed: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private getClient() {
    const { supabaseUrl, supabasePublishableKey } = environment;

    if (
      supabaseUrl.includes('YOUR_PROJECT_ID') ||
      supabasePublishableKey.includes('YOUR_SUPABASE_PUBLISHABLE_KEY')
    ) {
      throw new Error(
        'Add your Supabase project URL and publishable key in src/environments/environment.ts.',
      );
    }

    return createClient(supabaseUrl, supabasePublishableKey);
  }

  async getTodos(): Promise<Todo[]> {
    const { data, error } = await this.getClient()
      .from('todos')
      .select('id, created_at, name, is_completed')
      .order('created_at', { ascending: false })
      .returns<TodoRow[]>();

    if (error) {
      throw new Error(`Could not load todos: ${error.message}`);
    }

    return data.map((row) => ({
      id: row.id,
      title: row.name,
      completed: row.is_completed,
    }));
  }

  async addTodo(name: string): Promise<void> {
    const { error } = await this.getClient()
      .from('todos')
      .insert({ name, is_completed: false });

    if (error) {
      throw new Error(`Could not add todo: ${error.message}`);
    }
  }

  async updateTodo(id: Todo['id'], name: string): Promise<void> {
    const { data, error } = await this.getClient()
      .from('todos')
      .update({ name })
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`Could not update todo: ${error.message}`);
    }

    if (!data) {
      throw new Error('Could not update todo: no matching todo was found or you do not have permission.');
    }
  }

  async deleteTodo(id: Todo['id']): Promise<void> {
    const { data, error } = await this.getClient()
      .from('todos')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new Error(`Could not delete todo: ${error.message}`);
    }

    if (!data) {
      throw new Error('Could not delete todo: no matching todo was found or you do not have permission.');
    }
  }
}
