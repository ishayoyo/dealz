// app/components/auth/SignupForm.tsx
import { Form, useSubmit, useActionData } from '@remix-run/react';
import { VStack, FormControl, FormLabel, Input, Button, FormErrorMessage } from '@chakra-ui/react';

interface SignupFormProps {
  onClose: () => void;
}

export default function SignupForm({ onClose }: SignupFormProps) {
  const submit = useSubmit();
  const actionData = useActionData();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(event.currentTarget, { method: 'post', action: '/signup' });
  };

  return (
    <Form method="post" action="/signup" onSubmit={handleSubmit}>
      <VStack spacing={4}>
        <FormControl isInvalid={!!actionData?.errors?.username}>
          <FormLabel>Username</FormLabel>
          <Input type="text" name="username" required />
          <FormErrorMessage>{actionData?.errors?.username}</FormErrorMessage>
        </FormControl>
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
          Sign Up
        </Button>
      </VStack>
    </Form>
  );
}