import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TodoComponent } from './todo/todo';

@Component({
  selector: 'app-root',
  imports: [TodoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
