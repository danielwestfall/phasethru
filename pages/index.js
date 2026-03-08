export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/video',
      permanent: true,
    },
  };
}

export default function Home() {
  return null;
}
