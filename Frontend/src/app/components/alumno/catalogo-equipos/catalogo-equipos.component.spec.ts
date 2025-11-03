import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalogoEquiposComponent } from './catalogo-equipos.component';

describe('CatalogoEquiposComponent', () => {
  let component: CatalogoEquiposComponent;
  let fixture: ComponentFixture<CatalogoEquiposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogoEquiposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CatalogoEquiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
