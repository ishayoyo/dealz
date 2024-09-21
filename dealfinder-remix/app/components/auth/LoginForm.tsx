// app/components/auth/LoginForm.tsx
import { Form, useSubmit, useActionData } from '@remix-run/react';
import { VStack, FormControl, FormLabel, Input, Button, FormErrorMessage } from '@chakra-ui/react';

interface LoginFormProps {
  onClose: () => void;
}

export default function LoginForm({ onClose }: LoginFormProps) {
  const submit = useSubmit();
  const actionData = useActionData();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget, { method: 'post', action: '/login' });
  };

  return (
    <Form method="post" action="/login" onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!actionData?.errors?.email}>
          <FormLabel>Email</FormLabel>
          <Input type="email" name="email" required />
          <FormErrorMessage>{actionData?.errors?.email}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!actionData?.errors?.password}>
          <FormLabel>Password</FormLabel>
          <Input type="password" name="password" required />
          <FormErrorMessage>{actionData?.errors?.password}</FormErrorMessage>
        </FormControl>
        <Button type="submit" colorScheme="blue" width="full">
          Login
        </Button>
      </VStack>
    </Form>
  );
}
