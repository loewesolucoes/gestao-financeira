"use client";

export function Footer() {
  return (
    <footer>
      <Copyright />
    </footer>
  )
}

function Copyright({ sm }: any) {
  return <p className={`copyright ${sm ? 'sm' : 'lg'}`}>&copy; {new Date().getFullYear()}&nbsp;-&nbsp;<a href="https://loewesolucoes.github.io/">@ericoloewe</a></p>;
}

