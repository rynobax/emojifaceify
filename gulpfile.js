const gulp = require('gulp');
const ts = require('gulp-typescript');
const tslint = require("gulp-tslint");

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task("tslint", () =>
  tsProject.src()
    .pipe(tslint({
      formatter: "verbose"
    }))
    .pipe(tslint.report({
        emitError: false
    }))
);

gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
  gulp.watch('src/**/*.ts', ['scripts', 'tslint']);
});

gulp.task('default', ['watch', 'tslint']);