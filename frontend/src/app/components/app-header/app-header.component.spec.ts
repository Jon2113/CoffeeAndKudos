import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let component: AppHeaderComponent;
  let fixture: ComponentFixture<AppHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose today as a Date', () => {
    expect(component.today).toBeInstanceOf(Date);
  });

  it('should render the brand name', () => {
    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent).toContain('Coffee');
    expect(nativeEl.textContent).toContain('Kudos');
  });

  it('should render the current year in the date span', () => {
    const nativeEl: HTMLElement = fixture.nativeElement;
    const year = new Date().getFullYear().toString();
    expect(nativeEl.textContent).toContain(year);
  });

  it('should render team names', () => {
    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.textContent).toContain('Schäfer');
  });
});
